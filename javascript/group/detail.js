(async function(){
    var group;
    var rtn = await loadManbers();
    if (rtn){
        group = getNode("detail.js").tag;
        //添加新成员后返回的是小组ID，需要重新加载一下。
        if (typeof group === 'number'){
            group = await getGroup(group);
        }
        //组长
        setNodeText("leader",getMemberByAddress(group.leader).name);
        //组名
        setNodeText("name",group.name);
        //关联提案
        if (group.proposalId.toNumber()!=0){
            var proposal = getNode("proposal");
            var p = await getProposal(group.proposalId);
            proposal.innerText = p.name;
            proposal.tag = p;
            proposal.onclick = function(){
                goto("proposal/detail",this.tag);
            };
        }
        //余额
        setNodeText("balance",format(group.balance));
        //功劳积分
        setNodeText("bonus",format(group.bonus));
        //开始时间
        setNodeText("start",dateFormat(group.start));
        //组员
        setList(group.members);
        //状态
        if (group.approved){
            if (group.success) setNodeText("state","已成功");
            else setNodeText("state","已批准");
        }else setNodeText("state","待批准");
        if (!group.active) setNodeText("state","已解散");
        //批准者，当被批准后，会被清除，为批准功劳做准备
        var f=false;
        var approver = getNode("approver");
        for(var i=0;i<group.approver.length;i++){
            if (group.approver[i]==publicParam.address) {
                f=true;
            }
            approver.innerHTML += getMemberByAddress(group.approver[i]).name + " ";
        }
        //管理员才能使用的功能
        var admin = await isTreasuryAdmin();
        if (admin && !f && group.active && !(group.approved && group.success)){
            display("isAdmin",true);
            //两个按钮只能看到一个
            display("approve",!group.approved);
            display("success",group.approved);
            //批准
            getNode("approve").onclick=async function(){
                setLoading(1);
                const rtn = await groupApprove("批准此项专项小组的苦劳积分",group.id.toNumber());
                if (rtn){
                    goto("group/detail",group.id.toNumber());
                }
                setLoading(0);
            };
            //成功
            getNode("success").onclick=async function(){
                setLoading(1);
                const rtn = await groupSuccess("批准此项专项小组的功劳积分",group.id.toNumber());
                if (rtn){
                    goto("group/detail",group.id.toNumber());
                }
                setLoading(0);
            };
        }
        //组长才能使用的功能
        if (group.leader == publicParam.address && group.active){
            display("isLeader",true);
            //支付
            getNode("transfer").onclick=async function(){
                var member = getList("members");
                var amount = getNode("amount").value;
                var reason = getNode("reason").value;
                if (amount > parseFloat(format(group.balance))){
                    alert("支付金额超过余额");
                    return;
                }
                if (member.length==0){
                    alert("没有选中支付对象");
                    return;
                }
                if (reason.length==0){
                    alert("请输入支付理由");
                    return;
                }
                setLoading(1);
                const rtn = await groupTransfer("给组员付款",group.id.toNumber(),member[0],amount,reason);
                if (rtn){
                    goto("group/detail",group.id.toNumber());
                }
                setLoading(0);
            };
            //添加组员
            getNode("add").onclick=async function(){
                goto("group/addMember",group);
            };
            //移除组员
            getNode("remove").onclick=async function(){
                var member = getList("members");
                if (member.length==0){
                    alert("没有选中要移除的组员");
                    return;
                }
                setLoading(1);
                const rtn = await groupRemoveMember("从此小组中移除组员",group.id.toNumber(),member[0]);
                if (rtn){
                    var tmp = [];
                    for(var i=0;i<group.members.length;i++){
                        if (group.members[i] != member[0]) tmp.push(group.members[i]);
                    }
                    group.members = tmp;
                    setList(tmp);
                }
                setLoading(0);
            };
            //解散
            getNode("dismiss").onclick=async function(){
                if(group.balance.gt(0)){
                    if (confirm("此专项小组中还有余额没有用完，你确定要解散吗？")){
                        setLoading(1);
                        const rtn = await groupDismiss("解散此专项小组",group.id.toNumber());
                        if (rtn){
                            goto("group/list");
                        }
                        setLoading(0);
                    }
                }
            };
        }
        //返回按钮
        getNode("goback").onclick=function(){
            goto("group/list");
        };
    }
    /**
    * 覆盖main里的同名方法
    */
    function setList(members){
        var list = getNode("members");
        var line = list.children[0];
        clearAll(list);
        for(var i=0;i<members.length;i++){
            var m = getMemberByAddress(members[i]);
            if (m){
                var newLine = line.cloneNode(true);
                newLine.children[0].value = members[i];
                newLine.children[1].innerText = m.id + "."+ m.name;
                list.appendChild(newLine);
            }
        }
    }
})();