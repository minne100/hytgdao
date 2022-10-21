// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Membership.sol";
import "./Treasury.sol";
import "./Const.sol";

//import "hardhat/console.sol";

contract Group is Initializable{
    
    // 常量合约地址
    address _constAddress;

    // 薪酬项目数量
    uint _numOfGroup;

    // 专项小组
    struct GroupItem {
        string name;         //小组名称
        uint id;             //id
        address leader;      //小组的组长
        address[] members;   //小组的成员
        uint proposalId;     //提案ID，可以为0，表示不合提案相关
        uint start;          //成立的时间
        uint256 bonus;       //专项基金的奖金，可以为0
        uint256 balance;     //专项基金的余额，可以为0
        bool success;        //是否成功，如果成功可以领取奖金，不成功，奖金退回公库
        bool approved;       //是否被批准
        bool active;         //是否活跃
        address[] approver;  //批准者
    }

	//薪酬列表
    mapping(uint => GroupItem) private groupArr;

    //增加新项目
    event NewGroup(uint id);

    /** 
    * 初始化
    */
    function initialize(address constAddress) public initializer
    {
	    _constAddress = constAddress;
    }

    /** 
    * 获取本人参与的专项小组
    */
    function getMy() public view returns (GroupItem[] memory rtn){
        GroupItem[] memory tmp = new GroupItem[](_numOfGroup);
        uint c = 0;
        for (uint i = 0; i < _numOfGroup; i++) {
            for (uint j = 0; j < groupArr[i+1].members.length; j++) {
                if(groupArr[i+1].members[j] == msg.sender) {
                    tmp[c] = groupArr[i+1];
                    c++;
                    break;
                }
            }
        }
        rtn = new GroupItem[](c);
        for (uint i = 0; i < c; i++) rtn[i] = tmp[i];
    }
    /** 
    * 获取部分专项小组
    */
    function getGroupFromTo(uint from, uint to) public view returns (GroupItem[] memory rtn) {
        if (to <= from) revert("003");
        if (to>_numOfGroup) to = _numOfGroup;
        rtn = new GroupItem[](to-from);

        for (uint i = 0; i < to-from; i++) {
            rtn[i] = groupArr[_numOfGroup-(from + i)];
        }
    }
    /** 
    * 获取所有专项小组
    */
    function getGroups() public view returns (GroupItem[] memory rtn) {
        rtn = new GroupItem[](_numOfGroup);
        for (uint i = 0; i < _numOfGroup; i++) {
            rtn[i] = groupArr[i+1];
        }
    }
    /** 
    * 通过ID获取专项小组
    */
    function getGroup(uint id) public view returns (GroupItem memory){
        return groupArr[id];
    }
    /** 
    * 获取专项小组数量
    */
    function numOfGroup() public view returns (uint){
        return _numOfGroup;
    }
    /** 
    * 添加薪酬项，接受5个参数：会员地址，组名，相关的提案ID，专库资金，项目成功后的奖励
    */
    function newGroup(address[] calldata members,string calldata name,uint proposalId,uint balance,uint bonus) external {
        Const c = Const(_constAddress);
        Membership m = Membership(c.membershipAddress());
  		//发起人不是活跃会员
   		if (!m.isActiveMember(msg.sender)) revert("010");
  		//有人不是正式会员
        for(uint i=0;i<members.length;i++){
       		if (!m.isRealMember(members[i])) revert("042");
        }

        uint256 id = ++_numOfGroup;
        //创建一个新工资的实例
        GroupItem storage group = groupArr[id];
        group.id = id;
        group.leader = msg.sender;
	    group.members = members;
	    group.name = name;
        group.start = block.timestamp;
        group.proposalId = proposalId;
        group.balance = balance * 1 ether;
        group.bonus = bonus * 1 ether;
        group.active = true;
        if (balance==0){
            //不涉及金钱，无需批准
            group.approved = true;
        }
        if (bonus==0){
            //不涉及金钱，无需批准
            group.success = true;
        }
        emit NewGroup(id);
    }

    /** 
    * 添加成员，接受2个参数，小组id，新成员地址
    */
    function addMember(uint id, address member) external {
        Const c = Const(_constAddress);
        GroupItem storage group = groupArr[id];
  		//不是组长
        if(group.leader != msg.sender) revert("002");
        Membership m = Membership(c.membershipAddress());
  		//不是正式会员
        if (!m.isRealMember(member)) revert("042");
        for(uint i=0;i<group.members.length;i++){
            //已经是组员
            if (member == group.members[i]) revert("044");
        }
        group.members.push(member);
    }

    /** 
    * 删除成员，接受2个参数，小组id，成员地址
    */
    function removeMember(uint id, address member) external {
        GroupItem storage group = groupArr[id];
  		//不是组长
        if(group.leader != msg.sender) revert("002");
  		//不可删除组长
        if(group.leader == member) revert("045");
  		for(uint i=0;i<group.members.length;i++){
            if (group.members[i] == member) {
                delete group.members[i];
                break;
            }
        }
    }
    /** 
    * 添加批准的管理员，必须由公库合约调用
    */
    function addApprover(uint id,address member) external returns(uint8){
        Const c = Const(_constAddress);
		if (msg.sender != c.treasuryAddress()) revert("023");
        GroupItem storage group = groupArr[id];
        group.approver.push(member);
        return uint8(group.approver.length);
    }

    /** 
    * 批准资金使用，必须由公库合约调用
    */
    function approve(uint id) external {
        Const c = Const(_constAddress);
		if (msg.sender != c.treasuryAddress()) revert("023");
        GroupItem storage group = groupArr[id];
        group.approved = true;
        delete group.approver;
    }

    /** 
    * 项目成功，奖金部分可以使用，必须由公库合约调用
    */
    function success(uint id) external {
        Const c = Const(_constAddress);
		if (msg.sender != c.treasuryAddress()) revert("023");
        GroupItem storage group = groupArr[id];
        group.success = true;
        group.balance += group.bonus;
        group.bonus = 0;
    }

    /** 
    * 解散当前小组
    */
    function dismiss(uint id) external {
        Const c = Const(_constAddress);
        GroupItem storage group = groupArr[id];
  		//不是组长
        if (group.leader != msg.sender) revert("002");
  		//小组已经解散或尚未被批准
        if (!group.active) revert("047");
        group.active = false;
        group.balance = 0;
        group.bonus = 0;
        Treasury(payable(c.treasuryAddress())).groupDismiss(id); 
    }

    /** 
    * 给组员发奖金
    */
    function transfer(uint id, address member,uint amount,string calldata reason) external {
        Const c = Const(_constAddress);
        GroupItem storage group = groupArr[id];
  		//不是组长
        if (group.leader != msg.sender) revert("002");
  		//小组已经解散或尚未被批准
        if (!group.active) revert("047");
        uint256 bigAmount = amount * 1 ether;
  		//超支
        if (bigAmount > group.balance)  revert("046");
        for(uint i=0;i<group.members.length;i++){
            //是组员
            if (member == group.members[i]) {
                //给组员发放奖励积分
                group.balance -= bigAmount;
                Treasury(payable(c.treasuryAddress())).groupTransfer(id, member, bigAmount, reason); 
            }
        }
    }
}