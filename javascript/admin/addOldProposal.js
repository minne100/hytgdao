(async function(){
    if (!checkConnect()) return;
    var rtn = await loadManbers();
    if (rtn){
        //设置四个列表
        setList("proposers");
        setList("voters");
        setList("approvalVoters");
        setList("refuseVoters");
        //添加已有提案的逻辑
        getNode("addProposal").onclick=async function(){
            if (!checkConnect()) return;
            //获取输入值
            var name = getNode("name").value;
            var proposalTime = getNode("proposalTime").value;
            var isBig = getNode("isBig").checked;
            var isAnonymous = getNode("isAnonymous").checked;
            var proposal = getNode("proposal").value;
            var proposers = getList("proposers");
            var voters = getList("voters");
            var approvalVoters = getList("approvalVoters");
            var refuseVoters = getList("refuseVoters");
            //验证输入值
            if (name.length==0) {
                alert("提案名不能为空");
                return;
            }
            if (proposal.length==0) {
                alert("提案内容不能为空");
                return;
            }
            if (proposalTime.length!=10 || proposalTime.substr(4,1)!="/" || proposalTime.substr(7,1)!="/") {
                alert("提案时间不正确");
                return;
            }
            try{
                proposalTime = getUNIXTimestamp(proposalTime);
            }catch(e){
                alert("提案时间不正确，请按照yyyy/mm/dd格式输入");
                return;
            }        
            if (proposers.length==0) {
                alert("提案人不能为空");
                return;
            }

            setLoading(1);
            const rtn = await addOldProposal("添加提案",name,proposal,proposalTime,isBig,isAnonymous,proposers,voters,approvalVoters,refuseVoters);
            if(rtn){
                //将取得的提案ID和提案内容写入传统数据库中
                callAPI({webapi:"insertProposal","id":rtn.toNumber(),"proposal":proposal});
                //重置输入栏
                getNode("name").value="";
                getNode("proposalTime").value="";
                getNode("proposal").value="";
                getNode("isBig").checked = false;
                getNode("isAnonymous").checked = false;
                clearList("proposers");
                clearList("voters");
                clearList("approvalVoters");
                clearList("refuseVoters");
            }
            setLoading(0);
        };
    }
})();