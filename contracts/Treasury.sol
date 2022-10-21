// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./HAN.sol";
import "./Membership.sol";
import "./Salary.sol";
import "./Group.sol";
import "./Admin.sol";
import "./Const.sol";

import "hardhat/console.sol";

contract Treasury is Initializable{

    // 常数合约地址
    address _constAddress;

    // 积分发放历史
    struct RewardHistory{
        uint time;
        uint256 amount;
        string reason;
        bool received;
    }

    // 每个用户的可提现金额
    mapping(address=>uint) _withdrawable;

    // 每个用户的积分发放历史
    mapping(address=>RewardHistory[]) _rewardHistory;
    
    // 专项小组的账户余额
    mapping(uint=>uint256) _groupBalance;
    
    // 发放积分
    event RewardTransfer(address mamber,uint256 amount,string reason);

    //支付了会员费
    event PayMemberFee(Membership.MemberFee[] mf);

    /** 
    * 初始化
    */
    function initialize(address constAddress) public initializer {
	    _constAddress = constAddress;
    }

    /** 
    * 支付会费
    */
    function payMemberFee(uint256 amount) external{
        Const c = Const(_constAddress);
        Membership ms = Membership(c.membershipAddress());
        Membership.Member memory member = ms.getMemberByAddress(msg.sender);
        if (!member.isReal) revert("018");
        ERC20 dai = ERC20(c.daiAddress());
        //DAI余额不足
        if (dai.balanceOf(msg.sender)<amount)  revert("025");
        //DAI存入公库账户，之前需要在客户端执行approve
        dai.transferFrom(msg.sender, address(this), amount);
        //从公库向付款会员支付积分
        HAN(c.hanAddress()).transfer(msg.sender, amount * c.get("DAI2Token") / 1000);
        //更新缴费记录
        ms.payMemberFee(amount,msg.sender);
        member = ms.getMemberByAddress(msg.sender);
        emit PayMemberFee(member.memberFee);
    }

    /** 
    * 通过其他合约支付积分，积分需要用户自己去领取，自己支付Gas
    */
    function rewardTransfer(address member,uint256 amount,string memory reason) external {
        Const c = Const(_constAddress);
		if (msg.sender != c.membershipAddress() && msg.sender != c.proposalAddress() ) revert("023");
        //记录积分发放历史
        _rewardHistory[member].push(RewardHistory(block.timestamp, amount, reason, false));
        _withdrawable[member] += amount;
        //发出事件
        emit RewardTransfer(member, amount, reason);
    }

    /** 
    * 通过专项小组合约支付积分
    */
    function groupTransfer(uint id, address member,uint256 amount,string memory reason) external {
        Const c = Const(_constAddress);
		if (msg.sender != c.groupAddress() ) revert("023");
		if (_groupBalance[id] < amount) revert("046");
        //记录积分发放历史
        _rewardHistory[member].push(RewardHistory(block.timestamp, amount, reason, false));
        //转账
        _withdrawable[member] += amount;
        _groupBalance[id] -= amount;
        //发出事件
        emit RewardTransfer(member, amount, reason);
    }

    /** 
    * 获取可以提现的金额
    */
    function getWithdrawable(address member) public view returns (uint){
        return _withdrawable[member];
    }
    
    /** 
    * 获取积分奖励历史
    */
    function getRewardHistory(address member) public view returns (RewardHistory[] memory rtn){
        rtn = _rewardHistory[member];
    }
    /** 
    * 允许收钱
    */
    fallback() external payable {}
    receive() external payable {}

    /** 
    * 批准小组苦劳积分，接受1个参数：id
    */
    function groupApprove(uint id) external{
        Const c = Const(_constAddress);
        Admin a = Admin(c.adminAddress());
        Group g = Group(c.groupAddress());
  		//不是管理员
        if (!a.isAdmin(msg.sender)) revert("002");
        Group.GroupItem memory group = g.getGroup(id);
  		//不存在
        if (group.id==0) revert("040");
  		//已被批准
        if (group.approved) revert("035");
        for(uint i=0;i<group.approver.length;i++){
            //重复操作
            if (group.approver[i]==msg.sender)  revert("008");
        }
        //添加已经操作过的管理员
        uint8 al = g.addApprover(group.id,msg.sender);
        //判断苦劳积分需要几人批准
        if (a.han(group.balance)==al){
      		//达到人数要求了
            //国库余额不足
            require (HAN(c.hanAddress()).balanceOf(address(this)) >= group.balance, "024");
            //拨付苦劳积分
            _groupBalance[id] = group.balance;
            g.approve(id);
        }
    }
    /** 
    * 解散专项小组，将其余额清零，接受1个参数：id
    */
    function groupDismiss(uint id) external {
        Const c = Const(_constAddress);
		if (msg.sender != c.groupAddress()) revert("023");
        _groupBalance[id] = 0;
    }
    /** 
    * 批准小组功劳积分，接受1个参数：id
    */
    function groupSuccess(uint id) external {
        Const c = Const(_constAddress);
        Admin a = Admin(c.adminAddress());
        Group g = Group(c.groupAddress());
  		//不是管理员
        if (!a.isAdmin(msg.sender)) revert("002");
        Group.GroupItem memory group = g.getGroup(id);
  		//不存在
        if (group.id==0) revert("040");
  		//已被批准
        if (group.success) revert("035");
        for(uint i=0;i<group.approver.length;i++){
            //重复操作
            if (group.approver[i]==msg.sender)  revert("008");
        }
        //添加已经操作过的管理员
        uint8 al = g.addApprover(group.id,msg.sender);
        //判断功劳积分需要几人批准
        if (a.han(group.bonus)==al){
      		//达到人数要求了
            //国库余额不足
            require (HAN(c.hanAddress()).balanceOf(address(this)) >= group.bonus, "024");
            //拨付苦劳积分
            _groupBalance[id] += group.bonus;
            g.success(id);
        }
    }

    /** 
    * 领取奖励积分和薪酬
    */
    function withdraw() public {
        Const c = Const(_constAddress);
        address member = msg.sender;
        //奖励积分
        uint256 amount = _withdrawable[member];
        _withdrawable[member] = 0;
        //薪酬
        Salary salary = Salary(c.salaryAddress());
        Salary.MySalary memory mySalary = salary.getSalaryAmount(member);
        amount += mySalary.amount;
        //没有可以领取的积分
        require (amount > 0,"021");
        //国库余额不足
        require (HAN(c.hanAddress()).balanceOf(address(this)) >= amount, "024");
        HAN(c.hanAddress()).transfer(member, amount);
        //更新奖励项
        RewardHistory[] storage list = _rewardHistory[member];
        for(uint i=0;i<list.length;i++){
            if (!list[i].received) list[i].received = true;
        }
        //更新薪酬项
        for(uint i=0;i<mySalary.ids.length;i++){
            if (mySalary.ids[i]>0){
                salary.changeValue(mySalary.ids[i],mySalary.lastpays[i],mySalary.actives[i]);
            }
        }
    }    

    /** 
    * 判断是否为活跃用户
    */
    function isActiveMember(address member) private view returns(bool){
        Const c = Const(_constAddress);
        return Membership(c.membershipAddress()).isActiveMember(member);
    }
}