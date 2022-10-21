(async function(){
    if (!checkConnect()) return;
    var rtn = await loadManbers();
    if (rtn){
        //设置推荐人列表
        setList("upAddress");
        //添加老会员的业务逻辑
        getNode("addMember").onclick=async function(){
            if (!checkConnect()) return;
            //获取输入值
            var name = getNode("name").value;
            var address = getNode("address").value;
            var upAddress = getList("upAddress");
            var joinTime = getNode("joinTime").value;
            var lastPayAmount = getNode("lastPayAmount").value;
            //验证输入值
            if (name.length==0) {
                alert("会员名不能为空");
                return;
            }
            if (address.length!=42 || address.substr(0,2)!="0x") {
                alert("账号地址不正确");
                return;
            }
            if (publicParam.members.length == 0) upAddress = publicParam.address;
            else if (upAddress.length==0) {
                alert("介绍人不能为空");
                return;
            }else upAddress = upAddress[0];
            if (joinTime.length!=10 || joinTime.substr(4,1)!="/" || joinTime.substr(7,1)!="/") {
                alert("入会时间不正确，请按照yyyy/mm/dd格式输入");
                return;
            }
            try{
                joinTime = getUNIXTimestamp(joinTime);
            }catch(e){
                alert("入会时间不正确，请按照yyyy/mm/dd格式输入");
                return;
            }
            if (lastPayAmount<0){
                alert("支付会费金额不正确");
                return;
            }

            setLoading(1);
            const rtn = await addOldMember("添加会员"+name,name,address,upAddress,joinTime,lastPayAmount);
            if (rtn){
                //将取得的会员ID写入传统数据库中
                callAPI({webapi:"insertMember","id":rtn.toNumber(),"my":address});
                //清空用户列表
                publicParam.members = null;
                //跳转回主页重新载入用户列表
                goto("member/list");
            }
            setLoading(0);
        };
    }
})();