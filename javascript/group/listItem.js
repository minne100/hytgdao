(async function(){
    var list = getNode("table");
    var line = list.children[0];
    clearAll(list);
    for(var i=0;i<publicParam.groups.length;i++){
        var g = publicParam.groups[i];
        var newLine = line.cloneNode(true);
        list.appendChild(newLine);
        //关联提案
        if (g.proposalId.toNumber()!=0){
            var proposal = getSubNode(newLine,"proposal");
            var p = await getProposal(g.proposalId);
            proposal.tag = p;
            proposal.innerText = shortName(p.name);
            proposal.onclick = function(){
                goto("proposal/detail",this.tag);
            };
        }
        //点击组名查看详细信息
        var name = getSubNode(newLine,"name");
        var gn = g.name;
        if (gn.length>20) gn = gn.substr(0,20)+"...";
        name.innerText = gn;
        name.tag = g;
        name.onclick = function(){
            goto("group/detail",this.tag);
        };
        //组ID
        var groupId = getSubNode(newLine,"groupId");
        groupId.innerText = g.id.toNumber();
        //组长
        var leader = getSubNode(newLine,"leader");
        var m = getMemberByAddress(g.leader);
        leader.innerText = m.name;
        leader.tag = m.address;
        //让会员名可以点击，进入详细页面进行操作
        leader.onclick=function(){
            goto("member/info",this.tag);
        }
        //开始时间
        var start = getSubNode(newLine,"start");
        start.innerText = dateFormat(g.start);
        var state = getSubNode(newLine,"state");
        //根据状态值显示
        if (g.approved){
            if (g.success) state.innerText = "已成功";
            else state.innerText = "已批准";
        }else state.innerText = "待批准";
        if (!g.active) state.innerText = "已解散";
    }
})();