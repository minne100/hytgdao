// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Membership.sol";
import "./Admin.sol";
import "./Const.sol";

//import "hardhat/console.sol";

contract Salary is Initializable{
    
    // 常量
    uint constant ONCE  = 0;
    uint constant DAY   = 86400;
    uint constant MONTH = 2635200;
    uint constant YEAR  = 31557600;

    //常量合约地址
    address _constAddress;

    // 薪酬项目数量
    uint _numOfSalary;

    // 薪酬
    struct SalaryItem {
        address member;      //领薪酬的会员地址
        string reason;       //发薪酬的理由
        uint id;             //id
        uint period;         //领取周期，以秒为单位，0表示一次性支付，周期设为月的话，要为30.5天的秒数，年为365.25天
        uint start;          //开始的时间
        uint end;            //结束的时间，0为无限期
        uint256 amount;      //每次领取的金额 
        uint lastPay;        //最后一次领取的时间，0为还没领过
        bool approved;       //是否被批准
        bool active;         //是否在发放
        address[] approver;  //批准者
        address[] stoper;    //停止者
    }

    // 可领取薪酬
    struct MySalary{
        uint amount;
        uint[] ids;
        uint[] lastpays;
        bool[] actives;
    }
    
	//薪酬列表
    mapping(uint => SalaryItem) private salaryArr;

    //增加新项目
    event NewSalary(uint id);

    /** 
    * 初始化
    */
    function initialize(address constAddress) public initializer {
	    _constAddress = constAddress;
    }

    /** 
    * 获取薪酬项目数量
    */
    function numOfSalary() public view returns (uint){
        return _numOfSalary;
    }
    /** 
    * 获取本人的薪酬项目
    */
    function getSalaryItem(address member) public view returns (SalaryItem[] memory rtn) {
        SalaryItem[] memory tmp = new SalaryItem[](_numOfSalary);
        uint c = 0;
        for (uint i = 0; i < _numOfSalary; i++) {
            if(salaryArr[i+1].member == member) {
                tmp[c] = salaryArr[i+1];
                c++;
            }
        }
        rtn = new SalaryItem[](c);
        for (uint i = 0; i < c; i++) rtn[i] = tmp[i];
    }
    /** 
    * 获取待批准的薪酬项目
    */
    function getPendingSalary() public view returns (SalaryItem[] memory rtn) {
        Const c = Const(_constAddress);
        Admin a = Admin(c.adminAddress());
  		//不是管理员
        if (!a.isAdmin(msg.sender)) revert("002");
        SalaryItem[] memory tmp = new SalaryItem[](_numOfSalary);
        uint q = 0;
        for (uint i = 0; i < _numOfSalary; i++) {
            if(!salaryArr[i+1].approved) {
                bool f= false;
                for (uint j = 0; j < salaryArr[i+1].approver.length; j++) {
                    if (salaryArr[i+1].approver[j]==msg.sender) f=true;
                }
                if (!f){
                    tmp[q] = salaryArr[i+1];
                    q++;
                }
            }
        }
        rtn = new SalaryItem[](q);
        for (uint i = 0; i < q; i++) rtn[i] = tmp[i];
    }
    /** 
    * 获取部分薪酬项目
    */
    function getSalaryFromTo(uint from, uint to) public view returns (SalaryItem[] memory rtn) {
        if (to <= from) revert("003");
        if (to>_numOfSalary) to = _numOfSalary;
        rtn = new SalaryItem[](to-from);

        for (uint i = 0; i < to-from; i++) {
            rtn[i] = salaryArr[_numOfSalary-(from + i)];
        }
    }
    /** 
    * 添加薪酬项，接受7个参数：会员地址，理由，开始支付的日期，结束支付的日期，支付周期，支付金额，最后一次支付时间
    */
    function newSalary(address member,string calldata reason,uint start,uint end,uint period,uint amount,uint lastPay) external {
        Const c = Const(_constAddress);
        Membership m = Membership(c.membershipAddress());
        Admin a = Admin(c.adminAddress());
  		//不是管理员
        if (!a.isAdmin(msg.sender)) revert("002");
  		//领取人不是正式会员
   		if (!m.isRealMember(member)) revert("018");
  		//时间单位不正确
        if(period!=ONCE && period!=DAY && period!=MONTH && period!=YEAR) revert("041");

        uint256 id = ++_numOfSalary;
        //创建一个新工资的实例
        SalaryItem storage salary = salaryArr[id];
        salary.id = id;
	    salary.member = member;
	    salary.reason = reason;
        salary.start = start;
        salary.end = end;
        salary.period = period;
        salary.amount = amount * 1 ether;
        salary.lastPay = lastPay;
        if (lastPay==0) salary.lastPay = start;
        //添加人默认已经批准
        salary.approver.push(msg.sender);
        if (a.han(salary.amount)==1){
            salary.approved = true;
            salary.active = true;
        }
        //发出事件
        emit NewSalary(id);
    }
    /** 
    * 修改薪酬项，在用户每次从公库领取薪酬时，由公库合约调用
    * 接受3个参数：id，最后支付时间，和是否继续有效
    */
    function changeValue(uint id,uint lastPay,bool active) external {
        Const c = Const(_constAddress);
        if (msg.sender != c.treasuryAddress() ) revert("022");
        SalaryItem storage salary = salaryArr[id];
        salary.lastPay = lastPay;
        salary.active = active;
    }

    /** 
    * 批准薪酬项，接受1个参数：id
    */
    function approve(uint id) external {
        Const c = Const(_constAddress);
        Admin a = Admin(c.adminAddress());
  		//不是管理员
        if (!a.isAdmin(msg.sender)) revert("002");
        SalaryItem storage salary = salaryArr[id];
  		//不存在
        if (salary.id==0) revert("040");
  		//已被批准
        if (salary.approved) revert("035");
        for(uint i=0;i<salary.approver.length;i++){
            //重复操作
            if (salary.approver[i]==msg.sender)  revert("008");
        }
        //添加已经操作过的管理员
        salary.approver.push(msg.sender);
        if (a.han(salary.amount)==salary.approver.length){
      		//达到人数要求了
            salary.approved = true;
            salary.active = true;
        }
    }
    /** 
    * 获取本人可领取的薪酬金额
    */
    function getSalaryAmount(address member) public view returns(MySalary memory rtn){
        SalaryItem[] memory arr = getSalaryItem(member);
        //对需要修改的项目进行缓存，等支付完成后进行更新
        rtn.ids = new uint[](arr.length);
        rtn.lastpays = new uint[](arr.length);
        rtn.actives = new bool[](arr.length);
        for (uint i = 0; i < arr.length; i++) {
            Salary.SalaryItem memory si = arr[i];
            if (si.active){
                if(si.period==ONCE){
                    //一次性支付
                    if (si.active){
                        //被批准，没领取
                        rtn.amount += si.amount;
                        rtn.ids[i] = si.id;
                        rtn.actives[i] = false;
                        rtn.lastpays[i] = block.timestamp;
                    }
                }else if(si.period==DAY){
                    //每日支付
                    uint day;
                    if (si.end==0 || si.end > block.timestamp) day = (block.timestamp - si.lastPay)/DAY;
                    else day = (si.end - si.lastPay)/DAY;
                    if (si.active && day>0){
                        //被批准，超过1天没领取
                        rtn.amount += si.amount*day;
                        rtn.ids[i] = si.id;
                        rtn.lastpays[i] = si.lastPay + day*DAY;
                        rtn.actives[i] = !(si.end>0 && rtn.lastpays[i]>=si.end);
                    }
                }else if(si.period==MONTH){
                    //每月支付
                    uint month;
                    if (si.end==0 || si.end > block.timestamp) month = (block.timestamp - si.lastPay)/MONTH;
                    else month = (si.end - si.lastPay)/MONTH;
                    if (si.active && month>0){
                        //被批准，超过1个月没领取
                        rtn.amount += si.amount*month;
                        rtn.ids[i] = si.id;
                        rtn.lastpays[i] = si.lastPay + month*MONTH;
                        rtn.actives[i] = !(si.end>0 && rtn.lastpays[i]>=si.end);
                    }
                }else if(si.period==YEAR){
                    //每年支付
                    uint year;
                    if (si.end==0 || si.end > block.timestamp) year = (block.timestamp - si.lastPay)/YEAR;
                    else year = (si.end - si.lastPay)/YEAR;
                    if (si.active && year>0){
                        //被批准，超过1年没领取
                        rtn.amount += si.amount*year;
                        rtn.ids[i] = si.id;
                        rtn.lastpays[i] = si.lastPay + year*YEAR;
                        rtn.actives[i] = !(si.end>0 && rtn.lastpays[i]>=si.end);
                    }
                }
            }
        }
    }

    /** 
    * 停发薪酬，接受1个参数：id
    */
    function stop(uint id) external {
        Const c = Const(_constAddress);
        Admin a = Admin(c.adminAddress());
  		//不是管理员
        if (!a.isAdmin(msg.sender)) revert("002");
        SalaryItem storage salary = salaryArr[id];
  		//不存在
        if (salary.id==0) revert("040");
  		//已被停止
        if (!salary.active) revert("036");
        for(uint i=0;i<salary.stoper.length;i++){
            //重复操作
            if (salary.stoper[i]==msg.sender)  revert("008");
        }
        //添加已经操作过的管理员
        salary.stoper.push(msg.sender);
        if (salary.stoper.length==salary.approver.length){
      		//达到人数要求了
            salary.active = false;
        }
    }
}