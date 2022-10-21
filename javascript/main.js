/**
 * 超轻量级JS原生区块链项目开发框架
 * 
 * 作者：卢旭峰
 * 开源协议：MIT
 * 使用方法：index.html中加载web3modal和ethers这两个类库和全局用到的css，
 * 并且动态加载这个文件，调用init方法，然后根据需要加载其他组件。
 * web3modal类负责和其他浏览器钱包建立连接，ethers类负责和智能合约交互，
 * 如果只使用内置钱包，则不需要web3modal。
 * 每个模块由一个HTML文件和一个js文件组成，分别存放在各自的目录下，必须保证路径一致。
 * 组件内部的数据和方法对外不可见，只有本文件中的变量和方法，才在所有组件中可用。
 * 要进行组件间的交互，就要借助publicParam，将内部的方法或变量放入其中，
 * 调用组件通过loadPage方法。
 * 合约的地址和ABI都放在这个文件中，为了满足内置和插件钱包两方面的需求，
 * 通过callAPI函数与传统数据库或后台程序用json格式进行交互。
 * 框架根据域名自动切换测试或正式站点。
 * 该框架可以部署在IPFS网上，无需安装任何服务器端组件。
 * 页面设计和逻辑代码完全分离，方便美工人员对页面进行调整。
 * 所有和区块链交互的代码在后半段的代码中，原来是分成两个文件的，
 * 但多一次请求没什么意义，因此合二为一了。
 * 便于统一维护，开发3D代码时也无需改动。
 */

/**
 * 可以在所有模块中公用的数据
 */
var publicParam = {};
/**
* 程序版本，可以通过直接在页面后面带v的参数来更改，用于测试
*/
var version = 6;
/**
* 当前站点用的常量
*/
var current;
/**
* 所有用的的合约的ABI
*/
const ABI = {
  "DAI" : [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}],
  "CONST" : [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"changed","type":"uint256"}],"name":"ConstChange","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"inputs":[],"name":"adminAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"key","type":"string"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint8","name":"unit","type":"uint8"}],"name":"changeConst","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"daiAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"key","type":"string"}],"name":"get","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getLogs","outputs":[{"components":[{"internalType":"uint256","name":"time","type":"uint256"},{"internalType":"string","name":"key","type":"string"},{"internalType":"uint8","name":"unit","type":"uint8"},{"internalType":"uint256","name":"oldValue","type":"uint256"},{"internalType":"uint256","name":"newValue","type":"uint256"},{"internalType":"address[]","name":"approver","type":"address[]"}],"internalType":"struct Const.ChangingLog[]","name":"rtn","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"groupAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"hanAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"a","type":"string"},{"internalType":"string","name":"b","type":"string"}],"name":"isEqual","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"membershipAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nftAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"proposalAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"salaryAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"admin","type":"address"},{"internalType":"address","name":"membership","type":"address"},{"internalType":"address","name":"treasury","type":"address"},{"internalType":"address","name":"han","type":"address"},{"internalType":"address","name":"dai","type":"address"},{"internalType":"address","name":"proposal","type":"address"},{"internalType":"address","name":"group","type":"address"},{"internalType":"address","name":"nft","type":"address"},{"internalType":"address","name":"salary","type":"address"},{"internalType":"address","name":"vote","type":"address"}],"name":"setAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"treasuryAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"voteAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}],
  "HAN" : [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}],
  "NFT" : [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"uri","type":"string"},{"internalType":"address","name":"memberAddress","type":"address"}],"name":"createToken","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}],
  "VOTE" : [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"}],"name":"NewVote","type":"event"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"body","type":"string"},{"internalType":"string[]","name":"options","type":"string[]"},{"internalType":"uint256","name":"end","type":"uint256"},{"internalType":"uint256","name":"groupId","type":"uint256"}],"name":"createVote","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getMyVote","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"body","type":"string"},{"internalType":"address","name":"promoter","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"groupId","type":"uint256"},{"internalType":"uint256","name":"start","type":"uint256"},{"internalType":"uint256","name":"end","type":"uint256"},{"internalType":"string[]","name":"options","type":"string[]"},{"internalType":"address[]","name":"voters","type":"address[]"},{"internalType":"uint8[]","name":"results","type":"uint8[]"},{"internalType":"string[]","name":"reasons","type":"string[]"}],"internalType":"struct Vote.VoteItem[]","name":"rtn","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"getVote","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"body","type":"string"},{"internalType":"address","name":"promoter","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"groupId","type":"uint256"},{"internalType":"uint256","name":"start","type":"uint256"},{"internalType":"uint256","name":"end","type":"uint256"},{"internalType":"string[]","name":"options","type":"string[]"},{"internalType":"address[]","name":"voters","type":"address[]"},{"internalType":"uint8[]","name":"results","type":"uint8[]"},{"internalType":"string[]","name":"reasons","type":"string[]"}],"internalType":"struct Vote.VoteItem","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"from","type":"uint256"},{"internalType":"uint256","name":"to","type":"uint256"}],"name":"getVoteFromTo","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"body","type":"string"},{"internalType":"address","name":"promoter","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"groupId","type":"uint256"},{"internalType":"uint256","name":"start","type":"uint256"},{"internalType":"uint256","name":"end","type":"uint256"},{"internalType":"string[]","name":"options","type":"string[]"},{"internalType":"address[]","name":"voters","type":"address[]"},{"internalType":"uint8[]","name":"results","type":"uint8[]"},{"internalType":"string[]","name":"reasons","type":"string[]"}],"internalType":"struct Vote.VoteItem[]","name":"rtn","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"constAddress","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"numOfVote","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint8","name":"option","type":"uint8"},{"internalType":"string","name":"reason","type":"string"}],"name":"vote","outputs":[],"stateMutability":"nonpayable","type":"function"}],
  "ADMIN" : [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"changed","type":"uint256"}],"name":"AdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"inputs":[{"internalType":"address[]","name":"admins","type":"address[]"}],"name":"changeAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"dai","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"han","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"constAddress","type":"address"},{"internalType":"address[]","name":"admins","type":"address[]"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"member","type":"address"}],"name":"isAdmin","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}],
  "GROUP" : [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"}],"name":"NewGroup","type":"event"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"member","type":"address"}],"name":"addApprover","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"member","type":"address"}],"name":"addMember","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"dismiss","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"getGroup","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"leader","type":"address"},{"internalType":"address[]","name":"members","type":"address[]"},{"internalType":"uint256","name":"proposalId","type":"uint256"},{"internalType":"uint256","name":"start","type":"uint256"},{"internalType":"uint256","name":"bonus","type":"uint256"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bool","name":"approved","type":"bool"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"address[]","name":"approver","type":"address[]"}],"internalType":"struct Group.GroupItem","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"from","type":"uint256"},{"internalType":"uint256","name":"to","type":"uint256"}],"name":"getGroupFromTo","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"leader","type":"address"},{"internalType":"address[]","name":"members","type":"address[]"},{"internalType":"uint256","name":"proposalId","type":"uint256"},{"internalType":"uint256","name":"start","type":"uint256"},{"internalType":"uint256","name":"bonus","type":"uint256"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bool","name":"approved","type":"bool"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"address[]","name":"approver","type":"address[]"}],"internalType":"struct Group.GroupItem[]","name":"rtn","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getGroups","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"leader","type":"address"},{"internalType":"address[]","name":"members","type":"address[]"},{"internalType":"uint256","name":"proposalId","type":"uint256"},{"internalType":"uint256","name":"start","type":"uint256"},{"internalType":"uint256","name":"bonus","type":"uint256"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bool","name":"approved","type":"bool"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"address[]","name":"approver","type":"address[]"}],"internalType":"struct Group.GroupItem[]","name":"rtn","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getMy","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"leader","type":"address"},{"internalType":"address[]","name":"members","type":"address[]"},{"internalType":"uint256","name":"proposalId","type":"uint256"},{"internalType":"uint256","name":"start","type":"uint256"},{"internalType":"uint256","name":"bonus","type":"uint256"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bool","name":"approved","type":"bool"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"address[]","name":"approver","type":"address[]"}],"internalType":"struct Group.GroupItem[]","name":"rtn","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"constAddress","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"members","type":"address[]"},{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"proposalId","type":"uint256"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"bonus","type":"uint256"}],"name":"newGroup","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"numOfGroup","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"member","type":"address"}],"name":"removeMember","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"success","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"member","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"string","name":"reason","type":"string"}],"name":"transfer","outputs":[],"stateMutability":"nonpayable","type":"function"}],
  "SALARY" : [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"}],"name":"NewSalary","type":"event"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"lastPay","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"}],"name":"changeValue","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getPendingSalary","outputs":[{"components":[{"internalType":"address","name":"member","type":"address"},{"internalType":"string","name":"reason","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"period","type":"uint256"},{"internalType":"uint256","name":"start","type":"uint256"},{"internalType":"uint256","name":"end","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"lastPay","type":"uint256"},{"internalType":"bool","name":"approved","type":"bool"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"address[]","name":"approver","type":"address[]"},{"internalType":"address[]","name":"stoper","type":"address[]"}],"internalType":"struct Salary.SalaryItem[]","name":"rtn","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"member","type":"address"}],"name":"getSalaryAmount","outputs":[{"components":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"lastpays","type":"uint256[]"},{"internalType":"bool[]","name":"actives","type":"bool[]"}],"internalType":"struct Salary.MySalary","name":"rtn","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"from","type":"uint256"},{"internalType":"uint256","name":"to","type":"uint256"}],"name":"getSalaryFromTo","outputs":[{"components":[{"internalType":"address","name":"member","type":"address"},{"internalType":"string","name":"reason","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"period","type":"uint256"},{"internalType":"uint256","name":"start","type":"uint256"},{"internalType":"uint256","name":"end","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"lastPay","type":"uint256"},{"internalType":"bool","name":"approved","type":"bool"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"address[]","name":"approver","type":"address[]"},{"internalType":"address[]","name":"stoper","type":"address[]"}],"internalType":"struct Salary.SalaryItem[]","name":"rtn","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"member","type":"address"}],"name":"getSalaryItem","outputs":[{"components":[{"internalType":"address","name":"member","type":"address"},{"internalType":"string","name":"reason","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"period","type":"uint256"},{"internalType":"uint256","name":"start","type":"uint256"},{"internalType":"uint256","name":"end","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"lastPay","type":"uint256"},{"internalType":"bool","name":"approved","type":"bool"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"address[]","name":"approver","type":"address[]"},{"internalType":"address[]","name":"stoper","type":"address[]"}],"internalType":"struct Salary.SalaryItem[]","name":"rtn","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"constAddress","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"member","type":"address"},{"internalType":"string","name":"reason","type":"string"},{"internalType":"uint256","name":"start","type":"uint256"},{"internalType":"uint256","name":"end","type":"uint256"},{"internalType":"uint256","name":"period","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"lastPay","type":"uint256"}],"name":"newSalary","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"numOfSalary","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"stop","outputs":[],"stateMutability":"nonpayable","type":"function"}],
  "PROPOSAL" : [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"proposalId","type":"uint256"}],"name":"NewProposal","type":"event"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"body","type":"string"},{"internalType":"uint256","name":"proposalTime","type":"uint256"},{"internalType":"bool","name":"isBag","type":"bool"},{"internalType":"bool","name":"isAnonymous","type":"bool"},{"internalType":"address[]","name":"proposers","type":"address[]"},{"internalType":"address[]","name":"voters","type":"address[]"},{"internalType":"address[]","name":"approvalVoters","type":"address[]"},{"internalType":"address[]","name":"refuseVoters","type":"address[]"}],"name":"addOldProposal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"admin","type":"address"}],"name":"changeAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"body","type":"string"},{"internalType":"bool","name":"isBag","type":"bool"},{"internalType":"bool","name":"isAnonymous","type":"bool"},{"internalType":"bool","name":"byToken","type":"bool"},{"internalType":"uint8","name":"win","type":"uint8"},{"internalType":"address[]","name":"proposers","type":"address[]"},{"internalType":"uint256","name":"ratio","type":"uint256"}],"name":"createProposal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getActiveProposals","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"body","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"proposalTime","type":"uint256"},{"internalType":"uint256","name":"livePeriod","type":"uint256"},{"internalType":"uint256","name":"approval","type":"uint256"},{"internalType":"uint256","name":"refuse","type":"uint256"},{"internalType":"uint256","name":"approvalToken","type":"uint256"},{"internalType":"uint256","name":"refuseToken","type":"uint256"},{"internalType":"uint256","name":"waiver","type":"uint256"},{"internalType":"uint8","name":"win","type":"uint8"},{"internalType":"bool","name":"isWin","type":"bool"},{"internalType":"bool","name":"votingPassed","type":"bool"},{"internalType":"bool","name":"isBag","type":"bool"},{"internalType":"bool","name":"byToken","type":"bool"},{"internalType":"bool","name":"paid","type":"bool"},{"internalType":"bool","name":"isAnonymous","type":"bool"},{"internalType":"address[]","name":"proposers","type":"address[]"},{"internalType":"address[]","name":"voters","type":"address[]"},{"internalType":"address[]","name":"approvalVoters","type":"address[]"},{"internalType":"address[]","name":"refuseVoters","type":"address[]"},{"internalType":"string[]","name":"reason","type":"string[]"},{"internalType":"uint256","name":"ratio","type":"uint256"}],"internalType":"struct Proposal.ProposalItem[]","name":"props","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAdmin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"proposalId","type":"uint256"}],"name":"getProposal","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"body","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"proposalTime","type":"uint256"},{"internalType":"uint256","name":"livePeriod","type":"uint256"},{"internalType":"uint256","name":"approval","type":"uint256"},{"internalType":"uint256","name":"refuse","type":"uint256"},{"internalType":"uint256","name":"approvalToken","type":"uint256"},{"internalType":"uint256","name":"refuseToken","type":"uint256"},{"internalType":"uint256","name":"waiver","type":"uint256"},{"internalType":"uint8","name":"win","type":"uint8"},{"internalType":"bool","name":"isWin","type":"bool"},{"internalType":"bool","name":"votingPassed","type":"bool"},{"internalType":"bool","name":"isBag","type":"bool"},{"internalType":"bool","name":"byToken","type":"bool"},{"internalType":"bool","name":"paid","type":"bool"},{"internalType":"bool","name":"isAnonymous","type":"bool"},{"internalType":"address[]","name":"proposers","type":"address[]"},{"internalType":"address[]","name":"voters","type":"address[]"},{"internalType":"address[]","name":"approvalVoters","type":"address[]"},{"internalType":"address[]","name":"refuseVoters","type":"address[]"},{"internalType":"string[]","name":"reason","type":"string[]"},{"internalType":"uint256","name":"ratio","type":"uint256"}],"internalType":"struct Proposal.ProposalItem","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getProposals","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"body","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"proposalTime","type":"uint256"},{"internalType":"uint256","name":"livePeriod","type":"uint256"},{"internalType":"uint256","name":"approval","type":"uint256"},{"internalType":"uint256","name":"refuse","type":"uint256"},{"internalType":"uint256","name":"approvalToken","type":"uint256"},{"internalType":"uint256","name":"refuseToken","type":"uint256"},{"internalType":"uint256","name":"waiver","type":"uint256"},{"internalType":"uint8","name":"win","type":"uint8"},{"internalType":"bool","name":"isWin","type":"bool"},{"internalType":"bool","name":"votingPassed","type":"bool"},{"internalType":"bool","name":"isBag","type":"bool"},{"internalType":"bool","name":"byToken","type":"bool"},{"internalType":"bool","name":"paid","type":"bool"},{"internalType":"bool","name":"isAnonymous","type":"bool"},{"internalType":"address[]","name":"proposers","type":"address[]"},{"internalType":"address[]","name":"voters","type":"address[]"},{"internalType":"address[]","name":"approvalVoters","type":"address[]"},{"internalType":"address[]","name":"refuseVoters","type":"address[]"},{"internalType":"string[]","name":"reason","type":"string[]"},{"internalType":"uint256","name":"ratio","type":"uint256"}],"internalType":"struct Proposal.ProposalItem[]","name":"props","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"from","type":"uint256"},{"internalType":"uint256","name":"to","type":"uint256"}],"name":"getProposalsFromTo","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"body","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"proposalTime","type":"uint256"},{"internalType":"uint256","name":"livePeriod","type":"uint256"},{"internalType":"uint256","name":"approval","type":"uint256"},{"internalType":"uint256","name":"refuse","type":"uint256"},{"internalType":"uint256","name":"approvalToken","type":"uint256"},{"internalType":"uint256","name":"refuseToken","type":"uint256"},{"internalType":"uint256","name":"waiver","type":"uint256"},{"internalType":"uint8","name":"win","type":"uint8"},{"internalType":"bool","name":"isWin","type":"bool"},{"internalType":"bool","name":"votingPassed","type":"bool"},{"internalType":"bool","name":"isBag","type":"bool"},{"internalType":"bool","name":"byToken","type":"bool"},{"internalType":"bool","name":"paid","type":"bool"},{"internalType":"bool","name":"isAnonymous","type":"bool"},{"internalType":"address[]","name":"proposers","type":"address[]"},{"internalType":"address[]","name":"voters","type":"address[]"},{"internalType":"address[]","name":"approvalVoters","type":"address[]"},{"internalType":"address[]","name":"refuseVoters","type":"address[]"},{"internalType":"string[]","name":"reason","type":"string[]"},{"internalType":"uint256","name":"ratio","type":"uint256"}],"internalType":"struct Proposal.ProposalItem[]","name":"props","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"constAddress","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"numOfProposals","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"proposalId","type":"uint256"},{"internalType":"uint8","name":"decision","type":"uint8"},{"internalType":"string","name":"reason","type":"string"}],"name":"vote","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"proposalId","type":"uint256"}],"name":"voteCounting","outputs":[],"stateMutability":"nonpayable","type":"function"}],
  "TREASURY" : [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"components":[{"internalType":"uint256","name":"year","type":"uint256"},{"internalType":"uint256","name":"month","type":"uint256"}],"indexed":false,"internalType":"struct Membership.MemberFee[]","name":"mf","type":"tuple[]"}],"name":"PayMemberFee","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"mamber","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"string","name":"reason","type":"string"}],"name":"RewardTransfer","type":"event"},{"stateMutability":"payable","type":"fallback"},{"inputs":[{"internalType":"address","name":"member","type":"address"}],"name":"getRewardHistory","outputs":[{"components":[{"internalType":"uint256","name":"time","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"string","name":"reason","type":"string"},{"internalType":"bool","name":"received","type":"bool"}],"internalType":"struct Treasury.RewardHistory[]","name":"rtn","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"member","type":"address"}],"name":"getWithdrawable","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"groupApprove","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"groupDismiss","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"groupSuccess","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"member","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"string","name":"reason","type":"string"}],"name":"groupTransfer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"constAddress","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"payMemberFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"member","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"string","name":"reason","type":"string"}],"name":"rewardTransfer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}],
  "MEMBERSHIP" : [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"}],"name":"GetNFT","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"memberAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"}],"name":"NewMember","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"memberAddress","type":"address"}],"name":"NewRealMember","type":"event"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"address","name":"myAddress","type":"address"},{"internalType":"address","name":"upAddress","type":"address"},{"internalType":"uint256","name":"joinTime","type":"uint256"},{"internalType":"uint256","name":"payAmount","type":"uint256"}],"name":"addOldMember","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"approval","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getActiveCount","outputs":[{"internalType":"uint256","name":"c","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"}],"name":"getMemberByAddress","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"joinTime","type":"uint256"},{"internalType":"address","name":"my","type":"address"},{"internalType":"address","name":"up","type":"address"},{"internalType":"address[]","name":"down","type":"address[]"},{"internalType":"address[]","name":"approver","type":"address[]"},{"internalType":"bool","name":"isReal","type":"bool"},{"internalType":"uint256","name":"NFTid","type":"uint256"},{"components":[{"internalType":"uint256","name":"year","type":"uint256"},{"internalType":"uint256","name":"month","type":"uint256"}],"internalType":"struct MemberShip.MemberFee[]","name":"memberFee","type":"tuple[]"}],"internalType":"struct MemberShip.Member","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"getMemberByID","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"joinTime","type":"uint256"},{"internalType":"address","name":"my","type":"address"},{"internalType":"address","name":"up","type":"address"},{"internalType":"address[]","name":"down","type":"address[]"},{"internalType":"address[]","name":"approver","type":"address[]"},{"internalType":"bool","name":"isReal","type":"bool"},{"internalType":"uint256","name":"NFTid","type":"uint256"},{"components":[{"internalType":"uint256","name":"year","type":"uint256"},{"internalType":"uint256","name":"month","type":"uint256"}],"internalType":"struct MemberShip.MemberFee[]","name":"memberFee","type":"tuple[]"}],"internalType":"struct MemberShip.Member","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getMembers","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"joinTime","type":"uint256"},{"internalType":"address","name":"my","type":"address"},{"internalType":"address","name":"up","type":"address"},{"internalType":"address[]","name":"down","type":"address[]"},{"internalType":"address[]","name":"approver","type":"address[]"},{"internalType":"bool","name":"isReal","type":"bool"},{"internalType":"uint256","name":"NFTid","type":"uint256"},{"components":[{"internalType":"uint256","name":"year","type":"uint256"},{"internalType":"uint256","name":"month","type":"uint256"}],"internalType":"struct MemberShip.MemberFee[]","name":"memberFee","type":"tuple[]"}],"internalType":"struct MemberShip.Member[]","name":"mbs","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"from","type":"uint256"},{"internalType":"uint256","name":"to","type":"uint256"}],"name":"getMembersFromTo","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"joinTime","type":"uint256"},{"internalType":"address","name":"my","type":"address"},{"internalType":"address","name":"up","type":"address"},{"internalType":"address[]","name":"down","type":"address[]"},{"internalType":"address[]","name":"approver","type":"address[]"},{"internalType":"bool","name":"isReal","type":"bool"},{"internalType":"uint256","name":"NFTid","type":"uint256"},{"components":[{"internalType":"uint256","name":"year","type":"uint256"},{"internalType":"uint256","name":"month","type":"uint256"}],"internalType":"struct MemberShip.MemberFee[]","name":"memberFee","type":"tuple[]"}],"internalType":"struct MemberShip.Member[]","name":"mbs","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"tokenURI","type":"string"}],"name":"getNFT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getNewMembers","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"joinTime","type":"uint256"},{"internalType":"address","name":"my","type":"address"},{"internalType":"address","name":"up","type":"address"},{"internalType":"address[]","name":"down","type":"address[]"},{"internalType":"address[]","name":"approver","type":"address[]"},{"internalType":"bool","name":"isReal","type":"bool"},{"internalType":"uint256","name":"NFTid","type":"uint256"},{"components":[{"internalType":"uint256","name":"year","type":"uint256"},{"internalType":"uint256","name":"month","type":"uint256"}],"internalType":"struct MemberShip.MemberFee[]","name":"memberFee","type":"tuple[]"}],"internalType":"struct MemberShip.Member[]","name":"mbs","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOrder","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"constAddress","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"isActiveMember","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"isRealMember","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"address","name":"_address","type":"address"}],"name":"newMember","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"numOfMembers","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"member","type":"address"}],"name":"payMemberFee","outputs":[],"stateMutability":"nonpayable","type":"function"}],
  "EXCHANGE" : [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"stateMutability":"payable","type":"fallback"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"confirm","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getDAIReserve","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getMATICReserve","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getMyTransactions","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"time","type":"uint256"},{"internalType":"string","name":"transactionNo","type":"string"},{"internalType":"address","name":"member","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bool","name":"approval","type":"bool"}],"internalType":"struct Exchange.Transaction[]","name":"rtn","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTransactions","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"time","type":"uint256"},{"internalType":"string","name":"transactionNo","type":"string"},{"internalType":"address","name":"member","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bool","name":"approval","type":"bool"}],"internalType":"struct Exchange.Transaction[]","name":"rtn","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"constAddress","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"tid","type":"string"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"newTransaction","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}],
};
/**
* 测试站点所有合约的地址和服务器地址等
*/
const TEST = {
  "DAI" : "0x690a875b1b22A05e013203179d4074fD7AC11bD4",
  "CONST" : "0xcB1FCd49939e779aF9c2fbEA1a4d9f2b47461b59",
  "ADMIN" : "0x6DdAdC34c4dA5b539FA470042939F314978F6476",
  "VOTE" : "0x7BdE47B761de727D49CC4435ABAB69577Ee23eCc",
  "TREASURY" : "0x76312219bbD29a9e0c59c2DC3c2358F15eA07Afe",
  "GROUP" : "0xEAb96A42c1891AD95a93c5d3D92044a6E5CAF0d3",
  "SALARY" : "0xC5c1D3b05BA891Da18ec399754ebA8917F46a6EE",
  "PROPOSAL" : "0x4fC58F76f0aD9Aa71a0cD5f811f0b1C83F4c3be5",
  "MEMBERSHIP" : "0x3C4F1696A21B2655c4d59728AB94Fd7786B507De",
  "HAN" : "0x59273f1EAf2F30900862DE8a2173F4c0A53CF4Bc",
  "NFT" : "0x9401419E53a359d62D539450c39287f5908cb3e9",
  "EXCHANGE" : "0x1c0a9692B554984d51a322B45eb8c095B98ECBd4",
  "SERVER" : "http://daotest.smwho.cn/",
  "PROVIDER" : "https://polygon-mumbai.g.alchemy.com/v2/vQ1LSXw03Q3NsTjr1u28jcypbF1x6p4S",
  "NETWORK" : "mumbai",
  "CHAINID" : 80001
};
/**
* 正式站点所有合约的地址和服务器地址等
*/
const REAL = {
  "DAI" : "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
  "CONST" : "0x2562295D4479DdEaa28F48eD6bd7b5fDe6264F88",
  "ADMIN" : "0x8c1e2d6E010b3f777619CDB7A96E44DdD548ef82",
  "VOTE" : "0x0C1Ee68E6c460F76baBe8F30f19AA464ca80Af56",
  "TREASURY" : "0xb7f7bA9F0C99d436f3B87f9a30Ef8D07f38D8F8b",
    "GROUP" : "0xEAb96A42c1891AD95a93c5d3D92044a6E5CAF0d3",
  "SALARY" : "0xC5c1D3b05BA891Da18ec399754ebA8917F46a6EE",
  "PROPOSAL" : "0x4fC58F76f0aD9Aa71a0cD5f811f0b1C83F4c3be5",
  "MEMBERSHIP" : "0x3C4F1696A21B2655c4d59728AB94Fd7786B507De",
  "HAN" : "0x59273f1EAf2F30900862DE8a2173F4c0A53CF4Bc",
  "NFT" : "0x9401419E53a359d62D539450c39287f5908cb3e9",
  "SERVER" : "https://dao.smwho.cn/",
  "PROVIDER" : "https://polygon-mainnet.g.alchemy.com/v2/7SJ7WxRKaVizWOxm1RzEWn7iqOkc23Xi",
  "NETWORK" : "mainnet",
  "CHAINID" : 137
};
/**
* 合约内部的执行判定信息
*/
const ERRMSG = {
  "001":"创建人没有所添加合约中的代币",
  "002":"执行操作的不是管理员",
  "003":"起始编号小于结束编号",
  "004":"提案人不是活跃会员",
  "005":"添加过新纪录之后不可以再添加历史记录",
  "006":"提案ID不正确",
  "007":"提案尚未到结束时间",
  "008":"不要重复操作",
  "009":"投票奖励已经发放",
  "010":"您不是活跃会员，请先交会费",
  "011":"还有未完成的提案",
  "012":"只有管理员才可以更改设置",
  "013":"你不是活跃会员",
  "014":"添加的地址已经是会员",
  "015":"指定的介绍人不是正式会员",
  "016":"只有活跃会员才有权批准新会员",
  "017":"已经领取过会员证",
  "018":"不是正式会员",
  "019":"所投地址不是会员",
  "020":"投票还没开始",
  "021":"没有可以领取的积分",
  "022":"缴费金额不足",
  "022":"只能通过公库调用",
  "023":"只有公库管理员和合约内部可以调用",
  "024":"公库余额不足",
  "025":"DAI余额不足",
  "026":"合约地址不能为0",
  "027":"两种资产都不可以为0",
  "028":"投入HAN的金额太少，不足以维持汇率",
  "029":"数量不可以为0",
  "030":"交易所资产不足",
  "031":"当前汇率低于预期值",
  "032":"数量超过余额",
  "033":"只有管理员人才可以添加老会员",
  "034":"投票已经结束",
  "035":"已经被批准",
  "036":"已经被停止",
  "037":"输入的数值不符",
  "038":"公库管理员最少3人",
  "039":"选择的管理员与其他人不符",
  "040":"输入的工资项不存在",
  "041":"时间单位不正确",
  "042":"小组成员有人不是正式会员",
  "043":"不是正常选项",
  "044":"已经是小组成员了",
  "045":"不可以删除组长",
  "046":"支付金额超过专库余额",
  "047":"小组已经解散或尚未被批准",
  "048":"一次最多购买10个DAI",
  "049":"支付金额不正确",
  "050":"交易所MATIC余额不足",
  "051":"交易所DAI余额不足",
};
/**
* 可替换的信息
*/
const MESSAGE ={
  "Create Proposal" : "提案",
  "Vote" : "投票",
  "Proposal adopted" : "提案通过",
  "New member joining" : "新会员被批准",
  "New member" : "介绍新会员",
};
const ONCE  = 0;
const DAY   = 86400;
const MONTH = 2635200;
const YEAR  = 31557600;

/**
* 判断是否显示菜单按钮，实际的判断是在CSS中完成，
* 这里取巧，根据主菜单是否可见来作为判断的依据，
* 不知道为什么这个不可以用addEventListener来监听
*/
window.onresize=function(){
  display("menuButton",!isDisplay("mainMenu"));
};
/**
* 监听用户是否按了浏览器的返回按钮
* 和下一个方法一起，禁止用户使用返回按钮
* 因为使用本框架，所有的内容都在一个主页面下显示
*/
window.addEventListener("popstate",function(){
  pushState();
},false);
/**
* 给浏览历史堆栈加一个假的项目
*/
function pushState(){
  window.history.pushState({title:"汉语推广DAO",url:"#"},"汉语推广DAO","#");
}
/**
* 页面初始化
*/
function init(){
  //使用页面参数v来强制刷新缓存
  if (getURLVar('v')) version = getURLVar('v');
  //伪装浏览历史
  pushState();
  //根据域名判读是测试还是正式
  if (window.location.hostname.indexOf("test")>-1) current = TEST;
  else current = REAL;
  //载入页面框架
  loadPage("header");
}
/**
* 加载JS文件，通常不会单独调用
*/
function loadJs(js,div){
  var oScript= newNode("script");
  oScript.type = "text/javascript";
  oScript.src="/javascript/"+js+".js?ver="+version;
  //将载入的js挂在在指定的节点下，便于被卸载
  div.appendChild(oScript);
}
/**
* 加载html的页面组件，并且自动加载同名的js文件
* 第一个参数为加载的路径
* 第二个是指定加载的节点，可以是对象也可以是其ID，为空的话就默认为content
* 第三个是加载此组件是需要的参数，默认为空
*/
function loadPage(path,div=null,params=null){
  clearTimeout(publicParam.checkPaymentTimer);
  if (!div) div = getNode("content");
  //判断是id还是节点对象
  if((typeof div=='string') && div.constructor==String){
    div = getNode(div);
  }
  //避免空节点
  if(div){
    var html = new XMLHttpRequest();
    html.overrideMimeType("text/plain; charset=utf-8");
    //载入并且根据版本强制刷新
    html.open("GET","/html/"+path+".html?ver="+version);
    html.onreadystatechange = function(){
      if (html.readyState==4 && html.status == 200){
        while(div.children.length>0) div.removeChild(div.children[0]);
        //添加组件
        div.innerHTML = html.responseText;
        //如果有参数，将把组件的第一个节点的ID强制修改为文件名
        //使js程序可以通过id取到参数
        var tmp = path.split("/");
        div.children[0].id = tmp[tmp.length-1]+".js";
        div.children[0].tag = params;
        //加载js
        loadJs(path,div);
      }
    };
    html.send();
  }
}
/**
* 通过ID设置节点是否可见
*/
function display(name,b){
  var div = getNode(name);
  if (div){
    if (b) div.style.display="block";
    else div.style.display="none";
  }
}
/**
* 通过ID判断节点是否可见
*/
function isDisplay(name){
  var div = getNode(name);
  if(div){
    //获取最终应用的样式
    var styles = window.getComputedStyle(div,null);
    if (styles.display!="none") return true;
  }
  return false;
}
/**
* 设置密码旁的眼睛按钮
*/
function setEye(id){
  getNode("eye"+id).onclick=function(){
    var pswd = getNode("pswd"+id);
    if (pswd.type=="text") pswd.type="password";
    else  pswd.type="text";
  }
}
/**
* 通过ID设置节点内显示的文字
*/
function setNodeText(node,txt){
  var div = getNode(node);
  if (div) div.innerText=txt;
  return div;
}
/**
* 根据钱包地址，从已经加载的数据中搜索用户
*/
function getMemberByAddress (address) {
  for(var i=0;i<publicParam.members.length;i++){
    if(publicParam.members[i].address == address) return publicParam.members[i];
  }
  return null;
}
/**
* 获取用户本人
*/
function getMy(){
  for(var i=0;i<publicParam.members.length;i++){
    if(publicParam.members[i].address == publicParam.address) return publicParam.members[i];
  }
  return null;
}
/**
* 从区块链合约执行的结果中获取事件返回的数据
*/
function getArgs(val){
  for(var i=0;i<val.events.length;i++){
    if (val.events[i].args) return val.events[i].args;
  }
  return null;
}
/**
* 将区块链返回的UNIX时间戳转换为本地日期，
* 区块链放回的数据，无论在Solidity中设定什么格式，
* 只要是uint系列，一律返回BigNumber。
* 因为是时间戳，所以不需要考虑时区问题js自动调整了，
* 这个问题困扰我非常久，花了整整一下午，终于搞明白了。
*/
function dateFormat(date){
  var ts = date.toNumber()*1000;
  return new Date(ts).format("yyyy/MM/dd");
}
/**
* 将区块链返回的UNIX时间戳转换为本地时间
*/
function timeFormat(date){
  var ts = date.toNumber()*1000;
  return new Date(ts).format("yyyy/MM/dd hh:mm:ss");
}
/**
* 获取UNIX时间戳
*/
function getUNIXTimestamp(t){
  var y = t.substr(0,4);
  var m = t.substr(5,2)-1;
  var d = t.substr(8,2);
  var loc = new Date(y,m,d);
  return Math.floor(loc.getTime()/1000);
}
/**
* 获取当前的UNIX时间戳
*/
function time(){
  return Math.floor(new Date().getTime()/1000);
}
/**
* 访问函数计算，与传统数据库交互
* 第一个参数为包括函数计算方法的交互数据，如果要上传图像，必须转为Base64的数据，不支持form模式
* 第二个为回调方法，或方法的名称
*/
function callAPI(param,callback){
  if (param.webapi){
    //如有回调才显示进度遮罩页
    if (callback) setLoading(1);
    //钱包地址是必须的，作为判断用户的依据
    if (publicParam.address) param.address = publicParam.address;
    var api = new XMLHttpRequest();
    api.onreadystatechange = function(){
      if (api.readyState==4 && api.status == 200){
        setLoading(0);
        var data=null;
        if (api.responseText){
          //将数据库中的null转为空字符
          data = nullToStr(JSON.parse(api.responseText));
        }
        if (callback){
          if(typeof callback === "function"){
            //如果是方法就直接回调
            callback(data);
          }else{
            //如果是名称就转换一下
            eval(callback+"("+data+")");
          }
        }
      }
    };
    //设置函数计算的地址
    var url = current.SERVER + param.webapi+".php";
    //可选为同步模式
    var async = param.async;
    if (async==null) async = true;
    api.open("POST", url, async);
    api.setRequestHeader('content-type', 'application/json');
    //提交数据
    api.send(JSON.stringify(param));
  }else{
    debug("no webapi");
  }
}
/**
* 递归搜索某节点下面指定ID的节点
*/
function getSubNode(node,id){
  for(var i=0;i<node.children.length;i++){
    if (node.children[i].id == id) return node.children[i];
    if(node.children[i].children.length>0) {
      var sub = getSubNode(node.children[i],id);
      if (sub != null) return sub;
    }
  }
  return null;
}
/**
* 在content内切换页面，可以带参数
*/
function goto(name,params){
  loadPage(name,"mainSpace",params);
}
/**
* 获取用户列表中选定的用户地址，返回一个数组
*/
function getList(name){
  var rtn = [];
  var list = getNode(name);
  for(var i=0;i<list.children.length;i++){
    if (list.children[i].children[0].checked){
      rtn.push(list.children[i].children[0].value);
    }
  }
  return rtn;
}
/**
* 设置用户选择列表，具体是单选还是多选取决于页面设置
*/
function setList(name){
  var list = getNode(name);
  var line = list.children[0];
  clearAll(list);
  for(var i=0;i<publicParam.members.length;i++){
    var newLine = line.cloneNode(true);
    newLine.children[0].value = publicParam.members[i].address;
    newLine.children[1].innerText = publicParam.members[i].id + "."+ publicParam.members[i].name;
    list.appendChild(newLine);
  }
}
/**
* 清空用户列表已选项
*/
function clearList(name){
  var list = getNode(name);
  for(var i=0;i<list.children.length;i++){
    list.children[i].children[0].checked = false;
  }
}
/**
* 清空某对象的所有子项
* 不使用innerHTML=''，是为了使子节点占用的内存能被回收
*/
function clearAll(list){
  while(list.children.length>0) list.removeChild(list.children[0]);
}
/**
* 将数据库返回数组中的null全部转为空字符
*/
function nullToStr(data) {
  for (var x in data) {
    if (data[x] === null) { 
      data[x] = '';
    } else {
      // 遍历数组递归继续处理
      if (Array.isArray(data[x])) { 
        data[x] = data[x].map(z => {
          return nullToStr(z);
        });
      }
      // json也递归继续处理
      if(typeof(data[x]) === 'object'){ 
        data[x] = nullToStr(data[x]);
      }
    }
  }
  return data;
}
/**
* 将字符串缩短显示
*/
function shortName(txt,length=20) {
  if (txt.length>length) return txt.substr(0,length)+"...";
  else return txt;
}
/**
* 根据id返回一个节点
*/
function getNode(id){
  return document.getElementById(id);
}
/**
* 创建一个指定类型的新节点
*/
function newNode(type){
  return document.createElement(type);
}
/**
* 删除指定节点
*/
function removeNode(div){
  if (div) div.parentNode.removeChild(div);
}
/**
* console.log的缩写
*/
function debug(...e){
  console.log(e);
}
/**
* 显示一个遮罩全部页面的加载进度条
* 并且可以显示其中的具体步骤
* 接受两个参数，第一个为当前步数，不为0，则显示，为0则隐藏
* 第二个参数为总步数
*/
function setLoading (step,total) {
  if (step>0) {
    startTimer();
    display("cover",true);
    if (total)
      getNode("loadingStep").innerText=step+"/"+total;
    else
      getNode("loadingStep").innerText="";
  } else {
    //清除超时
    clearTimeout(publicParam.timer);
    display("cover",false);
  }
}
/**
* 对进度条加上超时
*/
function startTimer(){
  clearTimeout(publicParam.timer);
  publicParam.timer = setTimeout(()=>{
    if (isDisplay("cover"))
      getNode("loadingMsg").innerText="如果到现在还没转完，说明是出现其他问题了，请刷新浏览器重新尝试一下，如果屡次出现同样问题，请和系统管理员联系。";
  },30000);
}
/**
* 对大整数进行格式化显示，保留三位小数
*/
function format(val){
  var e = ethers.utils.formatUnits(val,18)
  var d = e.indexOf(".");
  return e.substr(0,d)+e.substr(d,5);
}
/**
* 将输入的数转换为大整数，第二个参数为的小数位数
*/
function parse(val){
  return ethers.utils.parseUnits(val,18);
}
/**
* 将对象保存在浏览器的存储空间中
*/
function saveItem(key,val){
  if (val==null) localStorage.removeItem(key);
  else localStorage.setItem(key, val);
}
/**
* 从浏览器的存储空间中按照键值取出对象
*/
function loadItem(key){
  return localStorage.getItem(key);
}
/**
* 从浏览器的存储空间中删除键值和对象
*/
function removeItem(key){
  localStorage.removeItem(key);
}
/**
* 获取当前时间的UNIX格式时间戳
*/
function getTimestamp(date){
  var t = new Date(date);
  return parseInt(t.getTime()/1000);
}
/**
* 显示密码强度
*/
function checkPassword(txt){
  var msg = "";
  var val = 0;
  if (txt.length<6){
    setNodeText("errmsg","密码最少6位；");
    return false;
  }
  if ((/[a-z]/.test(txt))) {
    val++;
  }
  if ((/[A-Z]/.test(txt))) {
    val++;
  }
  if ((/[0-9]/.test(txt))) {
    val++;
  }
  if ((/[^a-zA-Z0-9]/.test(txt))) {
    val++;
  }
  if (val==1) msg="您的密码太弱了，要注意安全哦！"
  else if (val==2) msg="您的密码比较弱";
  else if (val==3) msg="您的密码强度正常";
  else if (val==4) msg="您的密码很强悍！";
  setNodeText("errmsg",msg);
  return true;
}
/**
* 将钱包地址注册到十一维度的空间中
*/
function register(){
  var param = {webapi:"register",address:publicParam.address};
  if (publicParam.members){
    var my = getMy();
    if (my && my.name) param.nickname = my.name;
  }
  callAPI(param,(data)=>{
      if (data.statusCode==200){
          saveItem("registed"+publicParam.address,"true");
          getToken();
      }
  });
}
/**
* 获取十一维度的登录Token，并且跳转到其空间中
*/
function getToken(){
  if (loadItem("registed"+publicParam.address)=="true"){
      callAPI({webapi:"token",address:publicParam.address},(data)=>{
          window.location.href = "https://www.11xyz.com/dimension-pavilion-20/#/main?id=1087&token="+data.data.token;
      });
  }else register();
}
/**
* 为数组对象增加indexOf方法
*/
Array.prototype.indexOf = function (val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};
/**
* 为数组对象增加remove方法
*/
Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};
/**
* 为字符串对象增加replaceAll方法
*/
String.prototype.replaceAll = function(s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
};
/**
* 为日期对象增加clone方法
*/
Date.prototype.clone=function(){
  return new Date(this.valueOf());
};
/**
* 为日期对象增加format方法
*/
Date.prototype.format = function(fmt){
  var o ={
    "M+" :this.getMonth()+1,
    "d+" :this.getDate(),
    "h+" :this.getHours(),
    "m+" :this.getMinutes(),
    "s+" :this.getSeconds(),
    "q+" :Math.floor((this.getMonth()+3)/3),
    "S" :this.getMilliseconds()
  };
  if(/(y+)/.test(fmt)){
    fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4-RegExp.$1.length));
  }
  for(var k in o){
    if(new RegExp("("+ k +")").test(fmt)){
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1)?(o[k]):(("00"+o[k]).substr((""+o[k]).length)));
    }
  }
  return fmt;
};


/****************   以下是区块链相关代码    ************/

/**
* 获取区块链合约对象
* 教科书上虽然建议在调用只读的方法时用provider，而写入时用signer，
* 但实测下来并没有区别，为了省事就合二为一了
*/
function getContract(name){
  if (publicParam.usewallet=="metamask"){
    //连接Metamask钱包时需要验证一下网络，而内置钱包则不需要
    publicParam.provider.getNetwork().then(network=>{
      if(network.chainId != current.CHAINID) chainIdError();
    }).catch(chainIdError);
  }
  return new ethers.Contract(current[name], ABI[name], publicParam.signer);
}
/**
* 当连接的网络不正确时显示
*/
function chainIdError(){
  alert("您现在连接的区块链不正确，请连接到"+current.NETWORK);
  setLoading(0);
}
/**
* 在组件需要访问链上数据前，先判断是否和钱包建立了连接
*/
function checkConnect(){
  if (!publicParam.walletConnected) {
      alert("请先和钱包建立连接");
      return false;
  }
  return true;
}
/**
* 获取地址后在顶部的连接按钮上显示缩略地址
* 点击可复制地址
*/
function showAddress(){
  var wallet=getNode("wallet");
  wallet.innerText = publicParam.address.substr(0,5)+".."+publicParam.address.substr(40);
  wallet.onclick=function(){
      navigator.clipboard.writeText(publicParam.address);
      alert("已经复制了您的地址");
  };
}
/**
* 使用内置钱包时，显示确认按钮，并返回确认结果
* 使用Metamask时，直接返回true
*/
function isConfirm(gasLimit,txt){
  if (publicParam.usewallet=="metamask") return true;
  //虽然publicParam.gasPrice会不断变动，但是通常一次登录不会花很久，这里为了方便就只取一次
  var gas = format(gasLimit.mul(publicParam.gasPrice)).substr(0,8);
  return confirm("本次交易为："+txt+"，估计将花费"+gas+"个MATIC");
}
/**
* 显示合约执行时的异常信息
*/
function showError(e){
  debug(e);
  if(e.code==4001){
      alert("用户拒绝执行");
  }else if (e.code == "UNPREDICTABLE_GAS_LIMIT"){
      alert("MATIC余额不足");
  }else{
      alert("发生其他未知异常，请联系管理员或稍后再试");
  }
}
/**
* 显示合约验证时的提示
*/
function showMsg(e){
  debug(e);
  //内置钱包和插件钱包返回的信息格式不同，所以需要分别处理
  if(e.errorArgs){
      //内置钱包格式
      alert(ERRMSG[e.errorArgs[0]]);
  }else if(e.data && e.data.message){
      //插件钱包格式
      var tmp = e.data.message.split(": ");
      if (tmp.length==2){
      alert(ERRMSG[tmp[1]]);
      }
  }else{
      alert("发生其他未知异常，请联系管理员或稍后再试");
  }
}
/**
* 执行区块链的写入操作：
* 第一个参数为合约名；
* 第二个为方法名；
* 第三个是返回的参数名，可以为数组，也可以为空；
* 第四个是提示信息；
* 后面的参数数量不限，根据执行方法需要的参数依次罗列即可；
*/
async function writeBlock(contract,method,rtnParam,txt,...args){
  const p = await new Promise(async (resolve)=>{
    var con = getContract(contract);
    //可能无需参数
    var json = "[]";
    if (args) json = JSON.stringify(args);
    const p1 = "con.callStatic."+method+"(" + json.substring(1,json.length-1)+")";
    const p2 = "con.estimateGas."+method+"(" + json.substring(1,json.length-1)+")";
    const p3 = "con."+method+"(" + json.substring(1,json.length-1)+")";
    //预操作，判断是否符合写入合约的条件
    var callStatic = eval(p1);
    callStatic.then(async()=>{
      //获取此项交易的预估燃料
      const gas = await eval(p2);
      clearTimeout(publicParam.timer);
      //使用内置钱包时显示提示信息，使用Metamask时会直接跳过
      if(isConfirm(gas,txt)){
        //执行合约
        const run = eval(p3);
        run.then(async (tx)=>{
          //设定超时
          startTimer();
          //等待执行结果
          const val = await tx.wait();
          //取得执行结果
          const args = getArgs(val);
          if (args && rtnParam) {
            if(Array.isArray(rtnParam)){
              //如果是数组就循环读取，放在一个对象里
              var rtn = {};
              for(var i=0;i<rtnParam.length;i++){
                rtn[rtnParam[i]] = args[rtnParam[i]];
              }
              resolve(rtn);
            }else resolve(args[rtnParam]);
          }else resolve(true);
        })
        .catch((e)=>{
          //显示其他异常
          showError(e);
          resolve(false);
        });
      }else{
        resolve(false);
      }
    }).catch((e)=>{
      //显示合约验证信息
      showMsg(e);
      resolve(false);
    });
  });
  return p;
}
/**
* 添加老提案
*/
async function addOldProposal(txt,name,proposal,proposalTime,isBig,isAnonymous,proposers,voters,approvalVoters,refuseVoters){
  return writeBlock("PROPOSAL","addOldProposal","proposalId",txt,name,proposal,proposalTime,isBig,isAnonymous,proposers,voters,approvalVoters,refuseVoters);
}
/**
* 更新提案管理员
*/
async function changeVoteAdmin(txt,admin){
  return writeBlock("PROPOSAL","changeAdmin",null,txt,admin);
}
/**
* 更新公库管理员
*/
async function changeTreasuryAdmin(txt,admin){
  return writeBlock("ADMIN","changeAdmin","changed",txt,admin);
}
/**
* 批准专项小组
*/
async function groupApprove(txt,id){
  return writeBlock("TREASURY","groupApprove",null,txt,id);
}
/**
* 批准专项小组成功
*/
async function groupSuccess(txt,id){
  return writeBlock("TREASURY","groupSuccess",null,txt,id);
}
/**
* 专项小组解散
*/
async function groupDismiss(txt,id){
  return writeBlock("GROUP","dismiss",null,txt,id);
}
/**
* 专项小组转账
*/
async function groupTransfer(txt,id,member,amount,reason){
  return writeBlock("GROUP","transfer",null,txt,id,member,amount,reason);
}
/**
* 专项小组移除组员
*/
async function groupRemoveMember(txt,id,member){
  return writeBlock("GROUP","removeMember",null,txt,id,member);
}
/**
* 专项小组添加组员
*/
async function groupAddMember(txt,id,member){
  return writeBlock("GROUP","addMember",null,txt,id,member);
}
/**
* 创建专案小组
*/
async function newGroup (txt,members,name,proposal,balance,bonus){
  return writeBlock("GROUP","newGroup","id",txt,members,name,proposal,balance,bonus);
}
/**
* 购买DAI和MATIC
*/
async function newTransaction(txt,tid,amount){
  return writeBlock("EXCHANGE","newTransaction",null,txt,tid,amount);
}
/**
* 创建投票
*/
async function newVote (txt,name,body,options,end,groupId){
  return writeBlock("VOTE","createVote","id",txt,name,body,options,end,groupId);
}
/**
* 进行投票
*/
async function voteVote(txt,id,option,reason){
  return writeBlock("VOTE","vote",null,txt,id,option,reason);
}
/**
* 添加老会员
*/
async function addOldMember(txt,name,address,upAddress,joinTime,lastPayAmount){
  return writeBlock("MEMBERSHIP","addOldMember","id",txt,name,address,upAddress,joinTime,lastPayAmount);
}
/**
* 添加新会员
*/
async function addNewMember(txt,name,address){
  return await writeBlock("MEMBERSHIP","newMember","id",txt,name,address);
}
/**
* 发放薪酬
*/
async function newSalary(txt,member,reason,start,end,period,amount,lastPay){
  return writeBlock("SALARY","newSalary",null,txt,member,reason,start,end,period,amount,lastPay);
}
/**
* 捐赠MATIC
*/
async function MATICtransfer(txt,address,amount){
  const p = await new Promise(async (resolve)=>{
    const json = {
      from: publicParam.address,
      to: address,
      value: amount,
      nonce: publicParam.provider.getTransactionCount(publicParam.address,"latest")
    }
    const gasLimit = await publicParam.provider.estimateGas(json);
    if(isConfirm(gasLimit,txt)){
      publicParam.signer.sendTransaction(json).then(async(tx) => {
        const val = await tx.wait();
        resolve(true);
      }).catch (e=>{
        showError(e);
        resolve(false);
      });
    }else{
      resolve(false);
    }
  });
  return p;
}
/**
* 捐赠HAN
*/
async function HANtransfer(txt,address,amount){
  return writeBlock("HAN","transfer",null,txt,address,amount);
}
/**
* 捐赠DAI
*/
async function DAItransfer (txt,address,amount){
  return writeBlock("DAI","transfer",null,txt,address,amount);
}
/**
* 允许公库从个人账户中转走DAI
*/
async function DAIapprove(txt,amount){
  return writeBlock("DAI","approve",null,txt,current.TREASURY,amount);
}
/**
* 用DAI交会费
*/
async function payMemberFee (txt,amount){
  return writeBlock("TREASURY","payMemberFee","mf",txt,amount);
}
/**
* 批准成为正式用户
*/
async function memberApproval (txt,address){
  return writeBlock("MEMBERSHIP","approval","memberAddress",txt,address);
}
/**
* 领取NFT证书
*/
async function memberGetNFT (txt,url){
  return writeBlock("MEMBERSHIP","getNFT","id",txt,url);
}
/**
* 发起新提案
*/
async function createProposal (txt,name,proposal,isBig,isAnonymous,byToken,win,proposers,ratio){
  return writeBlock("PROPOSAL","createProposal","proposalId",txt,name,proposal,isBig,isAnonymous,byToken,win,proposers,ratio);
}
/**
* 计票
*/
async function voteCounting (txt,id){
  return writeBlock("PROPOSAL","voteCounting",null,txt,id);
}
/**
* 批准薪酬支付方案
*/
async function salaryApprove (txt,id){
  return writeBlock("SALARY","approve",null,txt,id);
}
/**
* 投票
*/
async function proposalVote (txt,id,decision,reason){
  return writeBlock("PROPOSAL","vote",null,txt,id,decision,reason);
}
/**
* 确认微信交易收款
*/
async function confirmTransaction (txt,id){
  return writeBlock("EXCHANGE","confirm",null,txt,id);
}
/**
* 修改系统常量
*/
async function changeConst (txt,key, value,unit){
  return writeBlock("CONST","changeConst","changed",txt,key, value,unit);
}
/**
* 领取奖励
*/
async function withdraw (txt){
  return writeBlock("TREASURY","withdraw",null,txt);
}
/**
* 获取所有会员信息
*/
async function loadManbers(){
  if (!publicParam.members) {
    const p = await new Promise(async (resolve)=>{
      setLoading(1);
      publicParam.memberCount = await numOfMembers();
      getMembers()
      .then(members =>{
        //获取全部会员的照片连接和自我简介，其他学历，职历等只有在需要浏览的时候才临时获取
        callAPI({webapi:"getMembers"}, function(data){
          publicParam.members = [];
          //获取当前的协议，用于判断照片网址
          var protocol = window.location.protocol.split(':')[0];
          for(var i=0;i<data.length;i++){
            //因为有可能区块链添加成功，但是数据库没成功，所以以数据库中的信息为准
            for(var j=0;j<members.length;j++){
              if (members[j][1].toNumber() == data[i].id){
                //不知何故获取的对象不能直接添加内容，因此复制出来，顺便做一下格式转换
                var member = {
                  name:members[j][0],
                  id:members[j][1].toNumber(),
                  joinTime:dateFormat(members[j][2]),
                  address:members[j][3],
                  up:members[j][4],
                  down:members[j][5],
                  approver:members[j][6],
                  isReal:members[j][7],
                  NFTid:members[j][8].toNumber(),
                  memberFee:members[j][9],
                  photo:data[i].photo,
                  about:data[i].about
                };
                //测试网没有ssl因此自动判断协议，如果将来用IPFS则不需要这个判断了
                if (member.photo && protocol=="https") member.photo = member.photo.replace("http:","https:");
                publicParam.members.push(member);
                break;
              }
            }
          }
          setLoading(0);
          resolve(true);
        });
      })
      .catch(e=>{
        debug(e);
        setLoading(0);
        alert("网络故障，请重新刷新网页，如果重复出现此问题，请检查Metamask钱包连接以及网络是否正常");
        resolve(false);
      });
    });
    return p;
  }else return true;
}
/**
* 获取NFT的URI
*/
async function getNFTURI(id){
  return await getContract("NFT").tokenURI(id);
}
/**
* 获取MATIC余额
*/
async function MATICbalance(){
  return await publicParam.provider.getBalance(publicParam.address, "pending");
}
/**
* 获取DAI余额
*/
async function DAIbalance(){
  return await getContract("DAI").balanceOf(publicParam.address);
}
/**
* 获取HAN余额
*/
async function HANbalance(){
  return await getContract("HAN").balanceOf(publicParam.address);
}
/**
* 获取公库DAI余额
*/
async function DAIbalancePublic(){
  return await getContract("DAI").balanceOf(current.TREASURY);
}
/**
* 获取公库HAN余额
*/
async function HANbalancePublic(){
  return await getContract("HAN").balanceOf(current.TREASURY);
}
/**
* 获取NFT数量
*/
async function NFTbalance(){
  return await getContract("NFT").balanceOf(publicParam.address);
}
/**
* 获取部分提案
*/
async function getProposalsFromTo(){
  return await getContract("PROPOSAL").getProposalsFromTo(publicParam.proposalsPage*publicParam.proposalsSize,(publicParam.proposalsPage+1)*publicParam.proposalsSize);
}
/**
* 获取一个提案
*/
async function getProposal(id){
  return await getContract("PROPOSAL").getProposal(id);
}
/**
* 获取部分专项小组
*/
async function getGroupFromTo(){
  return await getContract("GROUP").getGroupFromTo(publicParam.groupPage*publicParam.groupSize,(publicParam.groupPage+1)*publicParam.groupSize);
}
/**
* 获取一个专项小组
*/
async function getGroup(id){
  return await getContract("GROUP").getGroup(id);
}
/**
* 获取一个常量
*/
async function getConst(key){
  return await getContract("CONST").get(key);
}
/**
* 获取交易所DAI的余额
*/
async function getDAIReserve(){
  return await getContract("EXCHANGE").getDAIReserve();
}
/**
* 获取交易所MATIC的余额
*/
async function getMATICReserve(){
  return await getContract("EXCHANGE").getMATICReserve();
}
/**
* 获取一个投票
*/
async function getVote(id){
  return await getContract("VOTE").getVote(id);
}
/**
* 取得我的投票
*/
async function getMyVote (){
  return await getContract("VOTE").getMyVote();
}

/**
* 获取全部提案
*/
async function getProposals(){
  return await getContract("PROPOSAL").getProposals();
}
/**
* 获取全部小组
*/
async function getGroups(){
  return await getContract("GROUP").getGroups();
}
/**
* 获取部分薪酬
*/
async function getSalaryFromTo(){
  return await getContract("SALARY").getSalaryFromTo(publicParam.salaryPage*publicParam.salarySize,(publicParam.salaryPage+1)*publicParam.salarySize);
}
/**
* 获取部分薪酬
*/
async function getVoteFromTo(){
  return await getContract("VOTE").getVoteFromTo(publicParam.votePage*publicParam.voteSize,(publicParam.votePage+1)*publicParam.voteSize);
}
/**
* 获取我的薪酬
*/
async function getMySalary(){
  return await getContract("SALARY").getSalaryItem(publicParam.address);
}
/**
* 获取待批准的薪酬
*/
async function getPendingSalary(){
  return await getContract("SALARY").getPendingSalary();
}
/**
* 获取我的小组
*/
async function getMyGroup(){
  return await getContract("GROUP").getMy();
}
/**
* 获取可提奖励金额
*/
async function getWithdrawable(){
  return await getContract("TREASURY").getWithdrawable(publicParam.address);
}
/**
* 获取可提薪资金额
*/
async function getSalaryAmount(){
  return await getContract("SALARY").getSalaryAmount(publicParam.address);
}
/**
* 获取全部会员
*/
async function getMembers(){
  return await getContract("MEMBERSHIP").getMembers();
}
/**
* 获取会员数量
*/
async function numOfMembers(){
  return await getContract("MEMBERSHIP").numOfMembers();
}
/**
* 获取奖励一览
*/
async function getRewardHistory(){
  return await getContract("TREASURY").getRewardHistory(publicParam.address);
}
/**
* 获取提案数量
*/
async function numOfProposals(){
  return await getContract("PROPOSAL").numOfProposals();
}
/**
* 获取专案小组数量
*/
async function numOfGroup(){
  return await getContract("GROUP").numOfGroup();
}
/**
* 获取薪酬项目数量
*/
async function numOfSalary(){
  return await getContract("SALARY").numOfSalary();
}
/**
* 获取投票数量
*/
async function numOfVote(){
  return await getContract("VOTE").numOfVote();
}
/**
* 是否提案管理员
*/
async function isVoteAdmin(){
  var rtn = await getContract("PROPOSAL").getAdmin();
  return (rtn==publicParam.address);
}
/**
* 是否公库管理员
*/
async function isTreasuryAdmin(){
  return await getContract("ADMIN").isAdmin(publicParam.address);
}
/**
* 获取本人购买代币的记录
*/
async function getMyTransactions(){
  return await getContract("EXCHANGE").getMyTransactions();
}
/**
* 获取所有购买代币的记录
*/
async function getTransactions(){
  return await getContract("EXCHANGE").getTransactions();
}
/**
* 获取所有进行中的提案
*/
async function getActiveProposals(){
  return await getContract("PROPOSAL").getActiveProposals();
}
/**
* 创建新钱包
*/
async function newWallet(pswd){
  var wallet = ethers.Wallet.createRandom();
  var json = await wallet.encrypt(pswd);
  publicParam.address = wallet.address;
  saveItem("web3js_wallet",json);
  return wallet;
}
/**
* 恢复钱包
*/
async function inportWallet(pswd,phrase){
  var mnemonic = ethers.Wallet.fromMnemonic(phrase);
  var privateKey = mnemonic.privateKey;
  var wallet = new ethers.Wallet(privateKey);
  var json = await wallet.encrypt(pswd);
  publicParam.address = wallet.address;
  saveItem("web3js_wallet",json);
  return wallet;
}
/**
* 连接内置钱包
*/
function connectWallet(wallet){
  publicParam = {};
  publicParam.usewallet="builtIn";
  saveItem("usewallet",publicParam.usewallet);
  publicParam.address = wallet.address;
  publicParam.provider = new ethers.providers.JsonRpcProvider(current.PROVIDER);
  publicParam.signer = wallet.connect(publicParam.provider);
  //因为需要给用户显示一下大致的花费，所以比用Metamask连接多一个步骤
  publicParam.signer.getGasPrice().then(gas=>{
    publicParam.gasPrice = gas;
  });
  publicParam.walletConnected = true;
  showAddress();
}
/**
* 解锁内置钱包并登录
*/
async function walletLogin(pswd){
  const p = await new Promise(async (resolve)=>{
      var json = loadItem("web3js_wallet");
      ethers.Wallet.fromEncryptedJson(json, pswd).then(wallet=>{
        connectWallet(wallet);
        resolve(true);
      }).
      catch(e=>{
        resolve(false);
      });
  });
  return p;
}
/**
* 获取内置钱包
*/
async function getWallet(pswd){
  const p = await new Promise(async (resolve)=>{
    var json = loadItem("web3js_wallet");
    ethers.Wallet.fromEncryptedJson(json, pswd).then(wallet=>{
      resolve(wallet);
    }).
    catch(e=>{
      resolve(null);
    });
  });
  return p;
}
/**
* 修改密码
*/
async function changePassword(pswd0,pswd1){
  const p = await new Promise(async (resolve)=>{
      var json = loadItem("web3js_wallet");
      //验证原密码
      ethers.Wallet.fromEncryptedJson(json, pswd0).then(async wallet=>{
        //验证成功，生成新的加密信息
        json = await wallet.encrypt(pswd1);
        //保存
        saveItem("web3js_wallet",json);
        //清除所有当前保存的数据
        publicParam = [];
        resolve(true);
      }).
      catch(e=>{
        resolve(false);
      });
  });
  return p;
}
/**
* 连接Metamask钱包，获取地址
*/
async function connectMetamask() {
  const p = await new Promise(async (resolve)=>{
      connect().then(async ()=>{
          await getAddress();
          resolve(true);
      }).catch(()=>{
          resolve(false);
      });
  });
  return p;
}
/**
* 获取当前钱包地址
*/
async function getAddress() {
  publicParam = {};
  publicParam.usewallet = "metamask";
  publicParam.provider = new ethers.providers.Web3Provider(window.ethereum);
  publicParam.signer = publicParam.provider.getSigner();
  publicParam.address = await publicParam.signer.getAddress();
  //如果还没有连接就抛出异常
  if (!publicParam.address) Promise.reject();
  publicParam.walletConnected = true;

  //地址显示在界面上；
  showAddress();
  //初次启动时设定几个合约的关联地址
  try{
    var hanAddress = await getContract("CONST").hanAddress();
    if (hanAddress != current.HAN){
      setLoading(1,2);
      var rtn = getContract("CONST");
      var tx = await rtn.setAddress(
        current.ADMIN,
        current.MEMBERSHIP,
        current.TREASURY, 
        current.HAN, 
        current.DAI, 
        current.PROPOSAL, 
        current.GROUP, 
        current.NFT, 
        current.SALARY, 
        current.VOTE, 
      );
      await tx.wait();

      var han = await HANbalance();
      setLoading(2,2);
      rtn = getContract("HAN");
      tx = await rtn.transfer(current.TREASURY,han);
      await tx.wait();
      setLoading(0);
    }
  }catch(e){
    debug(e);
    setLoading(0);
  }
}
/**
* 获取节点并建立连接
*/
async function connect() {
  //Web3Modal最近出了2.0版，可以连接更多的钱包，但是怎么用还没有说明，所以先用1.0版
  const Web3Modal = window.Web3Modal.default;
  const web3Modal = new Web3Modal({
      network: current.NETWORK,
      providerOptions: {},
      disableInjectedProvider: false,
  });
  //这里的provider和ethers里面的provider并不是一个概念
  const provider = await web3Modal.connect();
  //将与节点的连接和ethers连起来
  const web3Provider = new ethers.providers.Web3Provider(provider);

  // 按照web3Modal的说明，应该是可以监听这四种状态变化的，可是事实上不起作用
  // 看到一个Next.js的代码，可以实现，但我自己试却不行
  provider.on("accountsChanged", (accounts) => {
    console.log(accounts);
  });
  provider.on("chainChanged", (chainId) => {
    console.log(chainId);
  });
  provider.on("connect", (info) => {
    console.log(info);
  });
  provider.on("disconnect", (error) => {
    console.log(error);
  });

  // 如果没有连接到对应的网络，显示要求切换的提示
  const { chainId } = await web3Provider.getNetwork();
  if (chainId !== current.CHAINID) chainIdError();
}
