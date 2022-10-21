// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Admin.sol";
//import "hardhat/console.sol";

contract Const is Initializable{
    
    //部署合约的用户
    address _owner;

    //管理员合约地址
    address public adminAddress;

    // 会员合约地址
    address public membershipAddress;

    // 会员合约地址
    address public treasuryAddress;

    // 积分合约地址
    address public hanAddress;

    // DAI合约地址
    address public daiAddress;

    // 提案合约地址
    address public proposalAddress;

    // 专项小组合约地址
    address public groupAddress;

    // NFT合约地址
    address public nftAddress;

    // 薪酬合约地址
    address public salaryAddress;

    // 投票合约地址
    address public voteAddress;

    // 记录编号
    uint _logid;

    // 修改记录
    struct ChangingLog {
        uint time;
        string key;
        uint8 unit;
        uint256 oldValue;
        uint256 newValue;
        address[] approver;
    }

    // 所有修改记录
    mapping(uint => ChangingLog) private logs;

    // 所有的常数
    mapping(string => uint256) private consts;

	// 所有的常数待修改项
    mapping(string => uint256) private newConsts;

	// 待修常数的已经批准人数
    mapping(string => address[]) private changing;

	// 开始修改的时间
    mapping(string => uint) private startChange;

    //修改常数的管理员人数
    event ConstChange(uint changed);

    /** 
    * 初始化
    */
    function initialize() public initializer
    {
	    _owner = msg.sender;
        //修改han的下线，不足时只需1人批准
        consts["han1"] = 2000 ether;
        //修改han的上线，超过需3人批准
        consts["han2"] = 200000 ether;
        //修改dai的下线，不足时只需1人批准
        consts["dai1"] = 200 ether;
        //修改dai的上线，超过需3人批准
        consts["dai2"] = 20000 ether;
        //会员每月交的会费DAI
        consts["memberFee"] = 2 ether;
        //邀请会员通过批准奖励
        consts["reward"] = 1000 ether;
        //邀请会员奖励
        consts["join"] = 1000 ether;
        //新会员批准人数
        consts["approver"] = 5;
        //DAI和HAN的汇率
        consts["DAI2Token"] = 7000;
        //重大提案投票的天数
        consts["bigVotingPeriod"] = 5 days;
        //非重大提案投票的天数
        consts["smallVotingPeriod"] = 3 days;
        //重大提案投票等待的天数
        consts["bigWaitingPeriod"] = 2 days;
        //非重大提案投票等待的天数
        consts["smallWaitingPeriod"] = 1 days;
        //投票的奖励积分
        consts["votingReward"] = 40 ether;
        //重大奖励积分
        consts["bigReward"] = 2000 ether;
        //非重大奖励积分
        consts["smallReward"] = 1000 ether;
        //重大提案积分
        consts["bigProposal"] = 2000 ether;
        //非重大提案积分
        consts["smallProposal"] = 1000 ether;
    }

    /** 
    * 设置相关的合约地址
    */
    function setAddress(
        address admin,
        address membership,
        address treasury,
        address han,
        address dai,
        address proposal,
        address group,
        address nft,
        address salary,
        address vote
    ) public
    {
		require(msg.sender == _owner, "012");
        if(admin != address(0)) adminAddress = admin;
        if(membership != address(0)) membershipAddress = membership;
        if(treasury != address(0)) treasuryAddress = treasury;
        if(han != address(0)) hanAddress = han;
        if(dai != address(0)) daiAddress = dai;
        if(proposal != address(0)) proposalAddress = proposal;
        if(group != address(0)) groupAddress = group;
        if(nft != address(0)) nftAddress = nft;
        if(salary != address(0)) salaryAddress = salary;
        if(vote != address(0)) voteAddress = vote;
    }

    /** 
    * 取得常数
    */
    function get(string calldata key) public view returns(uint256){
        return consts[key];
    }

    /** 
    * 获取全部修改记录
    */
    function getLogs() public view returns (ChangingLog[] memory rtn) {
        rtn = new ChangingLog[](_logid);

        for (uint i = 0; i < _logid; i++) {
            rtn[i] = logs[i];
        }
    }


    /** 
    * 试图修改常量
    */
    function changeConst(string calldata key, uint256 value,uint8 unit) public{
        Admin a = Admin(adminAddress);
  		//不是管理员
        if (!a.isAdmin(msg.sender)) revert("002");
  		//管理员确认超时，重置
        if (startChange[key] !=0 && startChange[key] + 48*3600 < block.timestamp) {
            newConsts[key] = 0;
            startChange[key] = 0;
            delete changing[key];
        }
        if (changing[key].length==0){
            //修改的发起者
            if (unit==1 || unit==2){
                //获取需要多少人确认
                uint c;
                if (unit==1) c=a.han(value);
                if (unit==2) c=a.dai(value);
                if (c==1){
                    //只需1人确认
                    address[] memory tmp = new address[](1);
                    tmp[0]=msg.sender;
                    change(key, value, unit,tmp);
                }else{
                    //否则记录下来，等待其他管理员确认
                    newConsts[key] = value;
                    changing[key].push(msg.sender);
                    startChange[key] = block.timestamp;
                    emit ConstChange(changing[key].length);
                }
            }else{
                //不涉及金额的常数，一个管理员就可以直接修改
                address[] memory tmp = new address[](1);
                tmp[0]=msg.sender;
                change(key, value, unit,tmp);
            }
        }else{
            for(uint i=0;i<changing[key].length;i++){
                //重复操作
                if (changing[key][i] == msg.sender) revert("008");
            }
            //输入的数值不一致
            if(newConsts[key] != value) revert("037");
            //又一个管理员确认了
            changing[key].push(msg.sender);
            emit ConstChange(changing[key].length);
            uint c;
            if (unit==1) c=a.han(value);
            if (unit==2) c=a.dai(value);
            if (c==changing[key].length){
                //达到了修改人数
                change(key, value, unit, changing[key]);
                //清除临时数据
                newConsts[key] = 0;
                startChange[key] = 0;
                delete changing[key];
            }
        }
    }

    /** 
    * 实际修改常量
    */
    function change(string calldata key, uint256 value,uint8 unit, address[] memory approver) private{
        uint id = _logid++;
        //保存修改记录
        ChangingLog storage log = logs[id];
        log.time = block.timestamp;
        log.oldValue = consts[key];
        log.newValue = value;
        log.unit = unit;
        log.key = key;
        log.approver = approver;
        //修改常数
        consts[key] = value;
    }
    /** 
    * 实际修改常量
    */
    function isEqual(string memory a, string memory b) public pure returns (bool) {
        bytes memory aa = bytes(a);
        bytes memory bb = bytes(b);
        // 如果长度不等，直接返回
        if (aa.length != bb.length) return false;
        // 按位比较
        for(uint i = 0; i < aa.length; i ++) {
            if(aa[i] != bb[i]) return false;
        }
        return true;
    }
}