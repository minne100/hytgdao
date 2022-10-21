(async function(){
    if (!checkConnect()) return;
    setLoading(1);
    var proposal = await getProposals();
    var rtn = await loadManbers();
    setLoading(0);
    if (rtn){
        var my = getMy();
        if (!my || !my.isReal){
            alert("您还不是正式会员");
            return;
        }
        //设置会员列表
        setList("members");
        //设置提案列表
        for(var i=0;i<proposal.length;i++){
            var option = newNode("option");
            option.innerText = proposal[i].name;
            option.value = proposal[i].id;
            getNode("proposal").appendChild(option);
        }
        //添加老会员的业务逻辑
        getNode("add").onclick=async function(){
            if (!checkConnect()) return;
            //获取输入值
            var name = getNode("name").value;
            var proposal = getNode("proposal").options[getNode("proposal").selectedIndex].value;
            var members = getList("members");
            var balance = getNode("balance").value;
            var bonus = getNode("bonus").value;
            //验证输入值
            if (name.length==0) {
                alert("组名不能为空");
                return;
            }
            var f=false;
            for(var i=0;i<members.length;i++){
                if (members[i]==publicParam.address) f=true;
            }
            if (!f){
                alert("您本人没在成员列表中");
                return;
            }

            setLoading(1);
            const rtn = await newGroup("创建专案小组",members,name,proposal,balance,bonus);
            if (rtn){
                //载入小组列表
                publicParam.groups = null;
                goto("group/list");
            }
            setLoading(0);
        };
    }
})();