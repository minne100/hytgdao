(async function(){
    if (!checkConnect()) return;
    var rtn = await loadManbers();
    if (rtn){
        //设置会员列表
        setList("members");
        //更新业务
        getNode("change").onclick=async function(){
            if (!checkConnect()) return;
            //获取输入值
            var admin = getList("members");
            //验证输入值
            if (admin.length!=3) {
                alert("需要选择三名管理员");
                return;
            }
            setLoading(1);
            const rtn = await changeTreasuryAdmin("更新提案管理员",admin);
            if (rtn){
                //重置输入栏
                clearList("members");
                if(rtn.toNumber()==3) alert("公库管理员已更新");
                else alert("目前已有"+rtn.toNumber()+"个公库管理员完成操作");
            }
            setLoading(0);
        };
    }
})();