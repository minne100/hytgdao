(async function(){
    /**
    * 显示钱包余额
    */
    if (!checkConnect()) return;
    var rtn = await loadManbers();
    if (rtn){
        setLoading(1);
        var dai = await getDAIReserve();
        setNodeText("dai",format(dai));
        var matic = await getMATICReserve();
        setNodeText("matic",format(matic));
        var data = await getTransactions();
        setLoading(0);
        if (data.length>0){
            var list = getNode("feeHistory");
            var line = list.children[0];
            clearAll(list);
            for(var i=0;i<data.length;i++){
                var newLine = line.cloneNode(true);
                var m = getMemberByAddress(data[i].member);
                if(data[i].approval){
                    newLine.children[0].children[0].style.color="yellow";    
                }else{
                    newLine.children[0].children[0].tag = data[i].id;
                    newLine.children[0].children[0].onclick=async function(){
                        setLoading(1);
                        const rtn = await confirmTransaction("确认交易",this.tag);
                        if (rtn){
                            newLine.children[0].children[0].style.color="yellow";
                            newLine.children[0].children[0].onclick="";
                        }
                        setLoading(0);
            
                    };
                }
                newLine.children[0].children[0].innerText=m.name+" 时间："+dateFormat(data[i].time)+
                    " 支付金额：￥"+ data[i].amount.toNumber()+"元 " + " 交易号："+data[i].transactionNo;
                list.appendChild(newLine);
            }
        }
    }
})();