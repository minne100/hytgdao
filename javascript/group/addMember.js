(async function(){
    var group = getNode("addMember.js").tag;
    //组员
    setList("members");
    setNodeText("name",group.name);
    getNode("addMember").onclick=async function(){
        var members = getList("members");
        if (members.length==0){
            alert("没有选择新组员");
            return;
        }
        for(var i=0;i<group.members.length;i++){
            if (group.members[i]==members[0]){
                alert("选定的已经是小组成员了");
                return;
            }
        }
        setLoading(1);
        const rtn = await groupAddMember("添加新组员", group.id.toNumber(),members[0]);
        if(rtn){
            goto("group/detail",group.id.toNumber());
        }
        setLoading(0);
    };
})();