// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./NFT.sol";
import "./HAN.sol";
import "./Treasury.sol";
import "./Admin.sol";
import "./Const.sol";

//import "hardhat/console.sol";

contract Membership is Initializable{

    //部署合约的用户
    address _owner;

    //可以添加历史数据
    bool _canAddOld;

    // 常量合约地址
    address _constAddress;

    // 会员数量
    uint _numOfMembers;

    //会员
    struct Member {
        string name;			//姓名
        uint id;                //ID
        uint joinTime;		    //加入时间
    	address my;		        //自己的地址
        address up;             //介绍人
        address[] down;         //介绍的人
        address[] approver;     //批准者
        bool isReal;            //是否正式会员       
        uint NFTid;             //NFT证书ID
        MemberFee[] memberFee;  //交会费时间
    }

    //交会费时间
    struct MemberFee {
        uint year;
        uint month;
    }

	//会员列表
    mapping(uint => Member) private members;

	//会员地址列表
    mapping(address => uint) private memberAddress;

    //增加新会员
    event NewMember(address memberAddress,uint id);

    //增加新正式会员
    event NewRealMember(address memberAddress);

    //领取NFT
    event GetNFT(uint id);

    // 邀请的奖励积分
    uint joinReward;

    /** 
    * 初始化
    */
    function initialize(address constAddress) public initializer {
        _constAddress = constAddress;
        _canAddOld = true;
        //创建人即为发起人
	    _owner = msg.sender;
    }

    /** 
    * 添加缴纳会费记录，可以提前预交，也可以随时补交
    */
    function setPayRecord(Member storage member,uint256 amount) private{
        Const c = Const(_constAddress);
        uint256 memberFee = c.get("memberFee");
        if (member.memberFee.length==0){
            //第一次添加记录
            (uint year, uint month,) = getDate(member.joinTime);
            //根据缴费金额，自动从入会日期开始按月记录
            for(uint i=0;i<amount/memberFee;i++){
                member.memberFee.push(MemberFee(year,month));
                month++;
                if (month>12){
                    month=1;
                    year++;
                }
            }
        }else{
            //已经交过费，取出最后一次缴费时间
            MemberFee[] storage mfs = member.memberFee;
            MemberFee storage mf = mfs[mfs.length-1];
            uint year = mf.year;
            uint month = mf.month;
            //从下一个月开始，根据缴费金额按月记录
            for(uint i=0;i<amount/memberFee;i++){
                month++;
                if (month>12){
                    month=1;
                    year++;
                }
                member.memberFee.push(MemberFee(year,month));
            }
        }
    }

    /** 
    * 获取全部会员
    */
    function getMembers() public view returns (Member[] memory mbs) {
        mbs = new Member[](_numOfMembers);

        for (uint i = 0; i < _numOfMembers; i++) {
            mbs[i] = members[i+1];
        }
    }

    /** 
    * 获取正式会员数量
    */
    function getActiveCount() public view returns (uint c) {
        Member[] memory tmp = new Member[](_numOfMembers);
        for (uint i = 0; i < _numOfMembers; i++) {
            if(tmp[i].isReal) c++;
        }
    }

    /** 
    * 获取积分排名
    */
    function getOrder() public view returns (uint) {
        Const c = Const(_constAddress);
        uint rtn = 0;
        HAN han = HAN(c.hanAddress());
        uint256 money = han.balanceOf(msg.sender);

        for (uint i = 0; i < _numOfMembers; i++) {
            uint256 mi = han.balanceOf(members[i + 1].my);
            if(mi>money) rtn++;
        }
        return rtn+1;
    }

    /** 
    * 获取部分会员
    */
    function getMembersFromTo(uint from, uint to) public view returns (Member[] memory mbs) {
        if (to <= from) revert("003");
        if (to > _numOfMembers) to = _numOfMembers;
        mbs = new Member[](to-from);

        for (uint i = 0; i < to-from; i++) {
            mbs[i] = members[from + i + 1];
        }
    }

    /** 
    * 获取非正式会员
    */
    function getNewMembers() public view returns (Member[] memory mbs) {
        Member[] memory tmp = new Member[](_numOfMembers);
        uint c = 0;
        for (uint i = 0; i < _numOfMembers; i++) {
            if(!members[i+1].isReal) {
                tmp[c] = members[i+1];
                c++;
            }
        }
        mbs = new Member[](c);
        for (uint i = 0; i < c; i++) mbs[i] = tmp[i];
    }

    /** 
    * 支付会费
    */
    function payMemberFee(uint amount,address member) external{
        Const c = Const(_constAddress);
        if (msg.sender != c.treasuryAddress()) revert("022");
        Member storage m = members[memberAddress[member]];
        //记录缴费时间
        setPayRecord(m, amount);
    }

    /** 
    * 通过地址获取会员
    */
    function getMemberByAddress(address addr) public view returns (Member memory) {
        return members[memberAddress[addr]];
    }

    /** 
    * 通过ID获取会员
    */
    function getMemberByID(uint id) public view returns (Member memory) {
        return members[id];
    }

    /** 
    * 获取会员数量
    */
    function numOfMembers() public view returns (uint) {
        return _numOfMembers;
    }

    /** 
    * 是否活跃会员
    */
    function isActiveMember(address _address) public view returns (bool) {
        Member memory member = members[memberAddress[_address]];
        MemberFee[] memory mfs = member.memberFee;
        //如果没有交过费，为非活跃
        if (mfs.length==0) return false;
        //取出最后一条缴费记录
        MemberFee memory mf = mfs[mfs.length-1];
        (uint year, uint month,) = getDate(block.timestamp);
        //如果时间相差不超过2个月，则为活跃
        return (mf.year*12+mf.month+1 >= year*12+month);
    }

    /** 
    * 是否正式会员
    */
    function isRealMember(address _address) public view returns (bool) {
        return members[memberAddress[_address]].isReal;
    }

    /** 
    * 添加新会员，接受两个参数：会员的名字和地址
    */
    function newMember(string calldata name, address _address) external payable {
        Const c = Const(_constAddress);
        _canAddOld = false;
        Member storage me = members[memberAddress[msg.sender]];
   		//介绍人是否会员
		if (!isActiveMember(msg.sender)) revert("013");
   		//是否已经是会员
		if (memberAddress[_address] > 0) revert("014");
   		//会员人数加一，成为新会员ID
        uint memberId = ++_numOfMembers;
        //创建一个新会员的实例
        Member storage member = members[memberId];
        member.id = memberId;
	    member.my = _address;
        member.name = name;
        member.joinTime = block.timestamp;
        member.up = msg.sender;
        //介绍人的下级中增加新人
        me.down.push(_address);
        //建立地址和用户ID的映射
        memberAddress[_address] = memberId;
        //介绍人自动投批准票
        member.approver.push(msg.sender);
        //如果无需批准的话，立刻就可以成为正式会员
        if (c.get("approver")==0){
            member.isReal = true;
            //介绍成功奖励
            string memory reason = "New member joining";
            Treasury(payable(c.treasuryAddress())).rewardTransfer(member.up, c.get("reward"), reason);
        }
        //介绍奖励
        string memory reason1 = "New member";
        Treasury(payable(c.treasuryAddress())).rewardTransfer(member.up, c.get("join"), reason1);
        //发出事件
        emit NewMember(_address,memberId);
    }

    /** 
    * 添加老会员，接受五个参数：会员的名字，地址，介绍人地址，入会时间，总计支付金额
    */
    function addOldMember(
        string calldata name,
        address myAddress,
        address upAddress,
        uint joinTime,
        uint payAmount
    )external
    {
        if (!_canAddOld) revert("005");
		if (msg.sender != _owner) revert("033");
   		//老会员是否添加过
		if (memberAddress[myAddress] > 0) revert("014");
   		//介绍人是否会员
        Member storage up = members[memberAddress[upAddress]];
		if (myAddress != upAddress && !up.isReal) revert("015");
   		//会员人数加一，成为新会员ID
        uint memberId = ++_numOfMembers;
        //创建一个新会员的实例
        Member storage member = members[memberId];
        member.id = memberId;
        member.name = name;
	    member.my = myAddress;
        member.joinTime = joinTime;
        member.up = upAddress;
        up.down.push(myAddress);
        memberAddress[myAddress] = memberId;
        member.isReal = true;
        setPayRecord(member, payAmount * 1 ether);
        //发出事件
        emit NewMember(myAddress,memberId);
    }

    /** 
    * 批准指定地址的用户成为正式会员
    */
    function approval(address _address) external
    {
        Const c = Const(_constAddress);
   		//批准人是否活跃会员
		if (!isActiveMember(msg.sender)) revert("016");
   		//取出会员的实例
        Member storage member = members[memberAddress[_address]];
        //所投地址不是会员
        if(member.id == 0 ) revert("019");
        //判断重复操作
        for(uint i=0; i < member.approver.length; i++){
            if (member.approver[i] == msg.sender) revert("008");
        }
        //增加批准者
        member.approver.push(msg.sender);
        //批准人数达标
        if (member.approver.length == c.get("approver")) {
            member.isReal = true;
            string memory reason = "New member joining";
            Treasury(payable(c.treasuryAddress())).rewardTransfer(member.up, c.get("reward"), reason);
            emit NewRealMember(_address);
        }
    }

    /** 
    * 领取NFT会员证
    */
    function getNFT(string memory tokenURI) 
        external returns (uint)
    {
        Const c = Const(_constAddress);
   		//取出会员的实例
        Member storage member = members[memberAddress[msg.sender]];
   		//是否领取了会员证
		if (member.NFTid>0) revert("017");
        //生成NFT
        uint tokenId = NFT(c.nftAddress()).createToken(tokenURI, msg.sender);
        member.NFTid = tokenId;
	    emit GetNFT(tokenId);
        return tokenId;
    }
    /** 
    * 根据时间戳计算年月日
    */
    function getDate(uint timestamp) private pure returns (uint year, uint month, uint day) {
        int __days = int(timestamp/86400);
 
        int L = __days + 68569 + 2440588;
        int N = 4 * L / 146097;
        L = L - (146097 * N + 3) / 4;
        int _year = 4000 * (L + 1) / 1461001;
        L = L - 1461 * _year / 4 + 31;
        int _month = 80 * L / 2447;
        int _day = L - 2447 * _month / 80;
        L = _month / 11;
        _month = _month + 2 - 12 * L;
        _year = 100 * (N - 49) + _year + L;
 
        year = uint(_year);
        month = uint(_month);
        day = uint(_day);
    }
}