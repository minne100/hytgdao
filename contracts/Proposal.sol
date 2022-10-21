// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Treasury.sol";
import "./HAN.sol";
import "./Membership.sol";
import "./Const.sol";

//import "hardhat/console.sol";

contract Proposal is Initializable{

    //常量合约地址
    address _constAddress;

    //可以添加历史数据
    bool _canAddOld;

    //提案管理员
    address _admin;

    //提案数量
    uint _numOfProposals;

	//提案
    struct ProposalItem {
        string name;					//提案名
        string body;					//提案内容
        uint id;						//ID
        uint proposalTime;			    //提案时间
        uint livePeriod;				//到期时间
        uint approval;				    //赞成票数
        uint refuse;					//反对票数
        uint256 approvalToken;			//赞成者的积分
        uint256 refuseToken;		    //反对者的积分
        uint waiver;					//弃权票数
        uint8 win;						//获胜比例，0-100间的整数
        bool isWin;     				//是否被批准
        bool votingPassed;				//是否结束
        bool isBag;						//是否重大提案
        bool byToken;					//以积分还是人数计票
        bool paid;						//已经支付奖励
        bool isAnonymous;               //是否匿名
        address[] proposers;	        //提案人
        address[] voters;		        //投票人
        address[] approvalVoters;       //投赞成票的人
        address[] refuseVoters;         //投反对票的人
        string[] reason;                //投反对票的理由
        uint ratio;			            //投票人数占正式会员的比例,0-10000之间的整数
    }

	//提案列表
    mapping(uint => ProposalItem) private proposals;

    //发出新提案
    event NewProposal(uint proposalId);
    
    //增加一个管理员权限的检查机制
    modifier ifAdmin() {
        if (msg.sender == _admin) {
            _;
        } else {
            revert("002");
        }
    }

    /** 
    * 初始化
    */
    function initialize(address constAddress) public initializer {
	    _constAddress = constAddress;
        _admin = msg.sender;
        _canAddOld = true;
    }

    /** 
    * 获取全部提案
    */
    function getProposals() public view returns (ProposalItem[] memory props) {
        props = new ProposalItem[](_numOfProposals);

        for (uint i = 0; i < _numOfProposals; i++) {
            props[i] = proposals[i+1];
        }
    }

    /** 
    * 获取全部活跃提案
    */
    function getActiveProposals() public view returns (ProposalItem[] memory props) {
        ProposalItem[] memory tmp = new ProposalItem[](_numOfProposals);
        uint c = 0;
        for (uint i = 0; i < _numOfProposals; i++) {
            if(!proposals[i+1].votingPassed) {
                tmp[c] = proposals[i+1];
                c++;
            }
        }
        props = new ProposalItem[](c);
        for (uint i = 0; i < c; i++) props[i] = tmp[i];
    }

    /** 
    * 逆序获取部分提案
    */
    function getProposalsFromTo(uint from, uint to) public view returns (ProposalItem[] memory props) {
        if (to <= from) revert("003");
        if (to>_numOfProposals) to = _numOfProposals;
        props = new ProposalItem[](to-from);

        for (uint i = 0; i < to-from; i++) {
            props[i] = proposals[_numOfProposals-(from + i)];
        }
    }

    /** 
    * 获取一个提案
    */
    function getProposal(uint proposalId) public view returns (ProposalItem memory) {
        return proposals[proposalId];
    }

    /** 
    * 获取提案数量
    */
    function numOfProposals() public view returns (uint) {
        return _numOfProposals;
    }

    /** 
    * 添加新的提案，接受8个参数：提案名、内容、是否重大提案、是否匿名、是否按积分计票、获胜比例、提案者的数组、参与投票人的比例
    */
    function createProposal(
        string calldata name,
        string calldata body,
        bool isBag,
        bool isAnonymous,
        bool byToken,
        uint8 win,
        address[] memory proposers,
        uint ratio
    ) external ifAdmin {
        Const c = Const(_constAddress);
        _canAddOld = false;
   		//检查所有的提案人都是活跃会员
   		for(uint i = 0;i<proposers.length;i++)
   			if (!isActiveMember(proposers[i])) revert("004");
   		//原来提案数加一后，成为新提案ID
        uint256 proposalId = ++_numOfProposals;
        //创建一个新提案的实例，
        //使用 storage 关键字，以确保状态变量得到维护，
        //然后将其引用分配给提案映射中的一个存储槽
        ProposalItem storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposalTime = block.timestamp;
        proposal.isBag = isBag;
        proposal.isAnonymous = isAnonymous;
        proposal.byToken = byToken;
        proposal.win = win;
        proposal.name = name;
        proposal.body = body;
        proposal.ratio = ratio;
        proposal.proposers = proposers;
        //到期时间
        if(isBag)
            proposal.livePeriod = block.timestamp + c.get("bigVotingPeriod");
        else 
            proposal.livePeriod = block.timestamp + c.get("smallVotingPeriod");
        string memory reason = "Create Proposal";
   		for(uint i = 0; i<proposers.length; i++){
            //提案奖励积分按人数平分
            rewardTransfer(proposal.proposers[i], (proposal.isBag?c.get("bigProposal"):c.get("smallProposal")) / proposal.proposers.length, reason);
        }
        //发出事件
        emit NewProposal(proposalId);
    }

    /** 
    * 添加以往的提案，接受9个参数：提案名、内容、提案时间、是否重大、是否匿名、提案者的数组、
    * 赞成票的数组、反对的数组、弃权的数组（匿名时则为左右投票人的数组）
    */
    function addOldProposal(
        string calldata name,
        string calldata body,
        uint proposalTime,
        bool isBag,
        bool isAnonymous,
        address[] memory proposers,
        address[] memory voters,
        address[] memory approvalVoters,
        address[] memory refuseVoters
    ) external ifAdmin {
        if (!_canAddOld) revert("005");
   		//原来提案数加一后，成为新提案ID
        uint proposalId = ++_numOfProposals;
        ProposalItem storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        if (!isAnonymous){
            proposal.approval = approvalVoters.length;
            proposal.refuse = refuseVoters.length;
            //实名表决，弃权票放在voters里
            proposal.waiver = voters.length;
        }else{
            proposal.voters = voters;
        }
        proposal.approvalVoters = approvalVoters;
        proposal.refuseVoters = refuseVoters;
        proposal.proposalTime = proposalTime;
        proposal.isAnonymous = isAnonymous;
        proposal.name = name;
        proposal.body = body;
        proposal.proposers = proposers;
        proposal.isBag = isBag;
        //因为入参的数量限制，所以以下几个就只能用固定值了
        proposal.win = 50;
        proposal.isWin = true;
        proposal.paid = true;
        proposal.votingPassed = true;
        proposal.byToken = false;
        //发出事件
        emit NewProposal(proposalId);
    }

    /** 
    * 判断是否为活跃用户
    */
    function isActiveMember(address member) private view returns(bool){
        Const c = Const(_constAddress);
        return Membership(c.membershipAddress()).isActiveMember(member);
    }

    /** 
    * 取得提案管理员地址
    */
    function getAdmin() public view returns(address){
        return _admin;
    }

    /** 
    * 投票，接受3个参数，
    * 提案id 
    * 1同意、2否决、其他任何数字都是弃权
    * 反对理由
    */
    function vote(uint proposalId, uint8 decision, string calldata reason) external {
        Const c = Const(_constAddress);
        if (!isActiveMember(msg.sender)) revert("010");
   		if (proposalId < 1 || proposalId > _numOfProposals) revert("006");
   		//取出提案的实例
        ProposalItem storage proposal = proposals[proposalId];
		//判断是否为活跃的提案
        if (votable(proposal)) revert("007");

    	//判断是否已经投过票
        checkVoters(proposal.voters);
        checkVoters(proposal.approvalVoters);
        checkVoters(proposal.refuseVoters);
   		//添加反对理由
        if (bytes(reason).length > 0) proposal.reason.push(reason);

        if (decision==1) {
        	//赞成
        	proposal.approval++;
        	proposal.approvalToken += getBalance(msg.sender);
        }else if(decision==2) {
        	//否决
        	proposal.refuse++;
        	proposal.refuseToken += getBalance(msg.sender);
        }else{
        	//弃权
        	proposal.waiver++;
        }
		//记录谁对这个提案投过票
        if(proposal.isAnonymous){
            proposal.voters.push(msg.sender);
        }else{
            if (decision==1) {
                proposal.approvalVoters.push(msg.sender);
            }else if(decision==2) {
                proposal.refuseVoters.push(msg.sender);
            }else{
                proposal.voters.push(msg.sender);
            }
        }
        //给投票者发放奖励积分
        rewardTransfer(msg.sender, c.get("votingReward"), "Vote");
    }

    /** 
    * 查询用户HAN的余额
    */
    function getBalance(address member) private view returns(uint){
        Const c = Const(_constAddress);
        return HAN(c.hanAddress()).balanceOf(member);
    }

    /** 
    * 判断是否为活跃的提案
    */
    function votable(ProposalItem storage proposal) private returns(bool){
        Const c = Const(_constAddress);
        if (block.timestamp > proposal.proposalTime + (proposal.isBag?c.get("bigWaitingPeriod"):c.get("smallWaitingPeriod"))){
            if (proposal.votingPassed || proposal.livePeriod <= block.timestamp) {
                //设置投票结束
                proposal.votingPassed = true;
                return true;
            }else return false;
        }else revert("020");
    }

    /** 
    * 判断是否已经投过票
    */
    function checkVoters(address[] storage voters) private view {
        for (uint i = 0; i < voters.length; i++) {
       		//如果已经投过则不可以再投
            if (voters[i] == msg.sender) revert("008");
        }
    }

    /** 
    * 计票
    */
    function voteCounting(uint proposalId) external ifAdmin {
   	    if (proposalId < 1 || proposalId > _numOfProposals) revert("006");
        Const c = Const(_constAddress);
        ProposalItem storage proposal = proposals[proposalId];

	    //已经付过款
        if (proposal.paid) revert("009");
	    //结束
        proposal.votingPassed = true;
	    //获取正式会员数量
        uint m = Membership(c.membershipAddress()).getActiveCount()*10000;
        //累计投票人数
        uint t = (proposal.waiver + proposal.approval + proposal.refuse)*10000;
        //投票人数不足	
        if (t/m < proposal.ratio){
            proposal.isWin = false;
        }else{
            //计票
            if (proposal.byToken){
                if (proposal.approvalToken/(proposal.approvalToken+proposal.refuseToken)*100 >= proposal.win) proposal.isWin = true;
            }else{
                if (proposal.approval/(proposal.approval+proposal.refuse)*100 >= proposal.win) proposal.isWin = true;
            }
        }				
        //设置付款完成
        proposal.paid = true;
        if (proposal.isWin){
            //对提案者支付成功奖励
            string memory reason = "Proposal adopted";
            for(uint i = 0; i < proposal.proposers.length; i++){
                rewardTransfer(proposal.proposers[i], (proposal.isBag?c.get("bigReward"):c.get("smallReward")) / proposal.proposers.length, reason);
            }
        }
    }

    /** 
    * 代用公库的发放奖励的接口
    */
    function rewardTransfer(address member,uint amount,string memory reason) private{
        Const c = Const(_constAddress);
        Treasury(payable(c.treasuryAddress())).rewardTransfer(member, amount, reason); 
    }

    /** 
    * 变更提案管理员
    */
    function changeAdmin(address admin) external ifAdmin {
        if (!isActiveMember(admin)) revert("010");
        _admin = admin;
    }
}
