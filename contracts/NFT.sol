// contracts/NFT.sol
// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "./Membership.sol";

contract NFT is ERC721Upgradeable {

    uint private _tokenIds;

	mapping (uint => string) private _tokenURIs;

    /** 
    * 初始化
    */
    function initialize() public initializer {
        ERC721Upgradeable.__ERC721_init("HYTGDAO NFT", "HANNFT");
    }
    
    /** 
    * 创建一个NFT，接受两个参数，NFT的URI和会员的地址
    */
    function createToken(string calldata uri, address memberAddress) public returns (uint){
        //由于这个合约只能由会员用户通过DAO合约调用，所以先判断一下会员是否是正式
        if (!Membership(msg.sender).isRealMember(memberAddress)) revert("018");
        //生成新的ID
        uint newItemId = ++_tokenIds;
        //铸造NFT
        _mint(msg.sender, newItemId);
        //为其设置URI
        _tokenURIs[newItemId] = uri;
        //将其转移到会员账户中
        transferFrom(msg.sender, memberAddress, newItemId);
        return newItemId;
    }

    /** 
    * 获取NFT的数据
    */
    function tokenURI(uint tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        string memory _tokenURI = _tokenURIs[tokenId];
        return _tokenURI;
    }
}