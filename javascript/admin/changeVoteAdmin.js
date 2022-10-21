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
            if (admin.length==0) {
                alert("没有选择新管理员");
                return;
            }
            setLoading(1);
            const rtn = await changeVoteAdmin("更新提案管理员",admin[0]);
            if (rtn){
                //重置输入栏
                clearList("members");
                alert("提案管理员已更新");
            }
            setLoading(0);
        };
    }
})();