// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Const.sol";

//import "hardhat/console.sol";

contract Admin is Initializable{
    
    //部署合约的用户
    address[] _admins;

    //准备变更管理员
    address[] _changeAdmin;
    address[] _newAdmins;

    address _constAddress;

    uint startAdminChange;

    //管理员变更了
    event AdminChanged(uint changed);

    /** 
    * 初始化
    */
    function initialize(address constAddress, address[] calldata admins) public initializer{
        bool f=false;
        //初始化的用户必须是管理员
        for(uint i=0;i<admins.length;i++){
            if (admins[i]==msg.sender) f=true;
        }
        require(f, "012");
        _constAddress = constAddress;
        _admins = admins;
    }

    /** 
    * 根据HAN的金额，判断需要几人批准
    */
    function han(uint256 amount) public view returns (uint8){
        Const c = Const(_constAddress);
        if (amount<=c.get("han1")) return 1;
        if (amount>c.get("han2")) return 3;
        return 2;
    }

    /** 
    * 根据HAN的金额，判断需要几人批准
    */
    function dai(uint256 amount) public view returns (uint8){
        Const c = Const(_constAddress);
        if (amount<=c.get("dai1")) return 1;
        if (amount>c.get("dai2")) return 3;
        return 2;
    }

    /** 
    * 判断是否管理员
    */
    function isAdmin(address member) public view returns (bool){
        for(uint i=0;i<_admins.length;i++){
            if (_admins[i] == member) return true;
        }
        return false;
    }

    /** 
    * 更新管理员
    */
    function changeAdmin(address[] calldata admins) public{
        if (admins.length<3) revert("038");
        if (!isAdmin(msg.sender)) revert("002");

        //如果超时则重置
        if (startAdminChange + 48*3600 < block.timestamp) delete _changeAdmin;
        //是原管理员
        if (_changeAdmin.length==0){
            //修改的发起者
            _newAdmins = admins;
            _changeAdmin.push(msg.sender);
            startAdminChange = block.timestamp;
            emit AdminChanged(_changeAdmin.length);
        }else{
            for(uint i=0;i<_changeAdmin.length;i++){
                //重复操作
                if (_changeAdmin[i] == msg.sender) revert("008");
            }
            //输入的人数不一致
            if (_newAdmins.length != admins.length) revert("039");
            for(uint i=0;i<admins.length;i++){
                //输入的地址不一致
                if (admins[i] != _newAdmins[i]) revert("039");
            }
            //又一个原管理员确认了
            _changeAdmin.push(msg.sender);
            emit AdminChanged(_changeAdmin.length);
            if (_changeAdmin.length == _admins.length){
                //可以修改了
                _admins = _newAdmins;
                delete _changeAdmin;
            }
        }
    }
}