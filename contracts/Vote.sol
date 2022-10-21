// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Membership.sol";
import "./Const.sol";

//import "hardhat/console.sol";

contract Vote is Initializable{

    address _constAddress;

    //投票数量
    uint _numOfVote;

	//投票
    struct VoteItem {
        string name;					//投票名
        string body;					//投票内容
        address promoter;	            //发起人
        uint id;						//ID
        uint groupId;   				//专案小组ID，为0则表示面向所有人
        uint start;			            //开始时间
        uint end;				        //结束时间
        string[] options;       	    //选项
        address[] voters;		        //投票人
        uint8[] results;                //投票结果
        string[] reasons;       	    //投票原因
    }

	//投票列表
    mapping(uint => VoteItem) private voteArr;

    //发出新投票
    event NewVote(uint id);
    
    /** 
    * 初始化
    */
    function initialize(address constAddress) public initializer {
	    _constAddress = constAddress;
    }

    /** 
    * 逆序获取部分投票
    */
    function getVoteFromTo(uint from, uint to) public view returns (VoteItem[] memory rtn){
        if (to <= from) revert("003");
        if (to>_numOfVote) to = _numOfVote;
        rtn = new VoteItem[](to-from);

        for (uint i = 0; i < to-from; i++) {
            rtn[i] = voteArr[_numOfVote-(from + i)];
        }
    }
    /** 
    * 我需要参与的投票
    */
    function getMyVote() public view returns (VoteItem[] memory rtn){
        Const c = Const(_constAddress);
        Group g = Group(c.groupAddress());
        VoteItem[] memory tmp = new VoteItem[](_numOfVote);
        uint n = 0;
        for (uint i = 0; i < _numOfVote; i++) {
            //是否结束
            if (voteArr[i+1].end > block.timestamp){
                bool f = false;
                //是否已经投过票
                for (uint j = 0; j < voteArr[i+1].voters.length; j++) {
                    if(voteArr[i+1].voters[j] == msg.sender) {
                        f=true;
                        break;
                    }
                }
                if (!f){
                    if(voteArr[i+1].groupId >0){
                        //指定小组
                        Group.GroupItem memory gi = g.getGroup(voteArr[i+1].groupId);
                        for (uint j = 0; j < gi.members.length; j++) {
                            //是其组员
                            if(gi.members[j] == msg.sender) {
                                tmp[n] = voteArr[i+1];
                                n++;
                                break;
                            }
                        }
                    }else{
                        //面向全体
                        tmp[n] = voteArr[i+1];
                        n++;
                    }
                }
            }
        }
        rtn = new VoteItem[](n);
        for (uint i = 0; i < n; i++) rtn[i] = tmp[i];
    }
    /** 
    * 通过ID获取投票
    */
    function getVote(uint id) public view returns (VoteItem memory){
        return voteArr[id];
    }
    /** 
    * 获取投票数量
    */
    function numOfVote() public view returns (uint){
        return _numOfVote;
    }

    /** 
    * 判断是否为活跃用户
    */
    function isActiveMember(address member) private view returns(bool){
        Const c = Const(_constAddress);
        return Membership(c.membershipAddress()).isActiveMember(member);
    }


    /** 
    * 添加新的投票，接受5个参数：提案名、内容、选项、结束时间、小组ID
    */
    function createVote(
        string calldata name,
        string calldata body,
        string[] memory options,
        uint end,
        uint groupId
    ) external {
   		//检查发起人是否活跃会员
        if (!isActiveMember(msg.sender)) revert("004");
   		//原来提案数加一后，成为新提案ID
        uint256 id = ++_numOfVote;
        //创建一个新提案的实例，
        VoteItem storage v = voteArr[id];
        v.id = id;
        v.promoter = msg.sender;
        v.start = block.timestamp;
        v.end = end;
        v.options = options;
        v.groupId = groupId;
        v.name = name;
        v.body = body;
        //发出事件
        emit NewVote(id);
    }
    /** 
    * 投票，接受3个参数，
    * 提案id 
    * 选项的序号
    * 反对理由
    */
    function vote(uint id, uint8 option, string calldata reason) external {
        if (!isActiveMember(msg.sender)) revert("010");
   		if (id < 1 || id > _numOfVote) revert("006");
   		//取出提案的实例
        VoteItem storage v = voteArr[id];
		//判断是否为活跃的提案
        if (v.end < block.timestamp) revert("007");
		//是否正常选项
   		if (option >= v.options.length) revert("043");

    	//判断是否已经投过票
        for(uint i=0;i<v.voters.length;i++){
            if (v.voters[i] == msg.sender) revert("008");
        }
        v.voters.push(msg.sender);
        v.reasons.push(reason);
        v.results.push(option);
    }
}
