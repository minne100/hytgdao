(async function(){
    if (!checkConnect()) return;
	// 查询公库余额
    var balanceOf = await DAIbalancePublic();
    setNodeText("dai",format(balanceOf));
    balanceOf = await HANbalancePublic();
    setNodeText("han",format(balanceOf));
})();