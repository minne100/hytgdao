// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Membership.sol";
import "./Admin.sol";
import "./Const.sol";

contract Exchange is Initializable{

    address _constAddress;

    uint _id;

	//交易
    struct Transaction {
        uint id;					//id
        uint time;                  //购买日期
        string transactionNo;		//微信交易号
        address member;             //付款人
        uint amount;    			//支付金额
        bool approval;              //管理员确认支付到账
    }

	//交易列表
    mapping(uint => Transaction) private transactionList;

    /** 
    * 初始化
    */
    function initialize(address constAddress) public initializer {
        require(constAddress != address(0), "026");
        _constAddress = constAddress;
    }

    /** 
    * 获取交易所中MATIC的余额
    */
    function getMATICReserve() public view returns (uint256) {
        return address(this).balance;
    }

    /** 
    * 获取交易所中DAI的余额
    */
    function getDAIReserve() public view returns (uint256) {
        Const c = Const(_constAddress);
        return ERC20(c.daiAddress()).balanceOf(address(this));
    }
    /** 
    * 允许收钱
    */
    fallback() external payable {}
    receive() external payable {}

    /** 
    * 通过上传微信交易号和金额领取DAI和MATIC
    * 为了减少麻烦，现在没有验证交易号的真假，反正是谁领取的都有记录，
    * 查账没有的话，再去追溯吧。
    */
    function newTransaction(string calldata tid,uint amount) external {
        Const c = Const(_constAddress);
        //不是正式会员
        Membership m = Membership(c.membershipAddress());
        if (!m.isRealMember(msg.sender)) revert("018");
        uint fee = c.get("memberFeeRMB");
        //最多买5个月的
        uint month = amount/fee;
        if (month>5) revert("048");
        //金额不正确
        if (amount!=month*fee) revert("049");
        //MATIC余额不足
        if (month * 0.3 ether > address(this).balance) revert("050");
        if (month * 2 ether > ERC20(c.daiAddress()).balanceOf(address(this))) revert("051");

        uint id = ++_id;
        Transaction storage transaction = transactionList[id];
        transaction.id = id;
        transaction.transactionNo = tid;
        transaction.amount = amount;
        transaction.time = block.timestamp;
        transaction.member = msg.sender;

        ERC20(c.daiAddress()).transfer(msg.sender, month * 2 ether);
        payable(msg.sender).transfer(month * 0.3 ether);
    }

    /** 
    * 确认收款
    */
    function confirm(uint id) external {
        Const c = Const(_constAddress);
        //不是管理员
        Admin a = Admin(c.adminAddress());
        if (!a.isAdmin(msg.sender))  revert("002");
        Transaction storage transaction = transactionList[id];
        if (transaction.amount>0 && !transaction.approval) transaction.approval = true;
    }

    /** 
    * 获取全部交易记录
    */
    function getTransactions() public view returns (Transaction[] memory rtn) {
        rtn = new Transaction[](_id);
        for (uint i = 0; i < _id; i++) {
            rtn[i] = transactionList[i+1];
        }
    }

    /** 
    * 获取我的交易记录
    */
    function getMyTransactions() public view returns (Transaction[] memory rtn) {
        Transaction[] memory tmp = new Transaction[](_id);
        uint c = 0;
        for (uint i = 0; i < _id; i++) {
            if(transactionList[i+1].member == msg.sender) {
                tmp[c] = transactionList[i+1];
                c++;
            }
        }
        rtn = new Transaction[](c);
        for (uint i = 0; i < c; i++) rtn[i] = tmp[i];
    }

}