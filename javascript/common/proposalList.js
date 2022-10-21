(function(){
    var list = getNode("table");
    var line = list.children[0];
    clearAll(list);
    for(var i=0;i<publicParam.proposals.length;i++){
        var p = publicParam.proposals[i];
        var newLine = line.cloneNode(true);
        list.appendChild(newLine);
        //点击提案名查看详细信息
        var name = getSubNode(newLine,"name");
        name.innerText = shortName(p.name);
        name.tag = p;
        name.onclick = function(){
            goto("proposal/detail",this.tag);
        };
        var proposers = getSubNode(newLine,"proposers");
        for(var j=0;j<p.proposers.length;j++){
            var a = newNode("a");
            proposers.appendChild(a);
            a.href="#";
            var m = getMemberByAddress(p.proposers[j]);
            a.innerText = m.name;
            a.tag = m.address;
            //让提案名可以点击，进入详细页面进行操作
            a.onclick=function(){
                goto("member/info",this.tag);
            }
            var br = newNode("br");
            proposers.appendChild(br);
        }
        //显示其余信息
        var proposalTime = getSubNode(newLine,"proposalTime");
        proposalTime.innerText = timeFormat(p.proposalTime);
        var isAnonymous = getSubNode(newLine,"isAnonymous");
        isAnonymous.innerText = (p.isAnonymous?"是":"否");
        var byToken = getSubNode(newLine,"byToken");
        byToken.innerText=(p.byToken?"积分":"人数");
        var state = getSubNode(newLine,"state");
        //根据状态值显示
        if (p.votingPassed){
            if (p.isWin) state.innerText="已通过";
            else state.innerText="未通过";
        }else{
            if(ended(p)){
                state.innerText="待计票";
            }else{
                if (started(p)){
                    state.innerText="投票中";
                }else{
                    state.innerText="展示中";
                }
            }
        }
    }
	/**
	* 判断表决是否开始
	*/
    function started(proposal){
        //根据是否重大决定等待天数
        var s = 1000*60*60*24*(proposal.isBag?2:1);
        //计算投票开始时间
        var start = new Date(proposal.proposalTime*1000 + new Date().getTimezoneOffset()* 60 * 1000 + s);
        return start <= new Date().getTime();
    }
	/**
	* 判断表决是否结束
	*/
    function ended(proposal){
        //根据是否重大决定等待天数
        var s = 1000*60*60*24*(proposal.isBag?5:3);
        //计算投票开始时间
        var end = new Date(proposal.proposalTime*1000 + new Date().getTimezoneOffset()* 60 * 1000 + s);
        return end <= new Date().getTime();
    }
})();