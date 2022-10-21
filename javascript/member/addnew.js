(async function(){
    if (!checkConnect()) return;
    var rtn = await loadManbers();
    if (rtn){
        var my = getMy();
        if (!my){
            alert("您还不是会员，请联系现有会员，请其作为您的邀请人");
            return;
        }
        getNode("addMember").onclick=async function(){
            if (!checkConnect()) return;
            var name = getNode("name").value;
            var address = getNode("address").value;
            if (name.length==0) {
                alert("姓名不能为空");
                return;
            }
            if (address.length!=42 && address.indexOf("0x")!=0) {
                alert("账号地址不正确");
                return;
            }
            setLoading(1);
            const rtn = await addNewMember("添加新会员"+name, name,address);
            if(rtn){
                callAPI({webapi:"insertMember","id":rtn.toNumber(),"my":address});
                alert("添加成功，为其捐赠一点MATIC，并邀请其他会员为其投票吧");
                publicParam.members = null;
                goto("home");
            }
            setLoading(0);
        };
    }
})();