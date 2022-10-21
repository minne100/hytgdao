// contracts/HAN.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract HAN is ERC20Upgradeable{

    /** 
    * 初始化
    */
    function initialize() public initializer {
        ERC20Upgradeable.__ERC20_init("HYTG Governance Token", "HAN");
        _mint(msg.sender, 100000000 ether);
    }

}
