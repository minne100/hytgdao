// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
 
contract DAI is ERC20 {
    constructor() ERC20("Fake DAI", "DAI") {
        _mint(msg.sender, 1000000000 ether );
    }
   
}
