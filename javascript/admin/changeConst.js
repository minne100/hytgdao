(async function(){
    if (!checkConnect()) return;
    //输入完后载入常量值
    getNode("key").onblur = async function(){
        var value = await getConst(this.value);
        if (parseFloat(format(value))<1) {
            getNode("unit").selectedIndex=0;
            getNode("value").value = value;
        }else{
            getNode("unit").selectedIndex=1;
            if (this.value.indexOf("dai")>-1)
                getNode("unit").selectedIndex=2;
            getNode("value").value = format(value);
        }
    };
    //更新业务
    getNode("change").onclick = async function(){
        if (!checkConnect()) return;
        //获取输入值
        var value = getNode("value").value;
        var key = getNode("key").value;
        var unit = getNode("unit").selectedIndex;
        //验证输入值
        if (value<=0) {
            alert("常数必须大于0");
            return;
        }
        //转为大整数
        if (unit>0) value = parse(value);
        else value = parseInt(value);
        setLoading(1);
        var v1,v2;
        if (unit==1){
            v1 = await getConst("han1");
            v2 = await getConst("han2");
        }else if (unit==2){
            v1 = await getConst("dai1");
            v2 = await getConst("dai2");
        }
        const rtn = await changeConst("更新系统常量",key, value,unit);
        if (rtn){
            if (unit==0) alert("您提交的修改已经生效。");
            else {
                var v0 = parseFloat(getNode("value").value);
                v1 = parseFloat(format(v1));
                v2 = parseFloat(format(v2));
                var c = 2;
                if (v0<=v1) c=1;
                if (v0>v2) c=3;
                if (rtn<c) alert("您提交的修改已经有"+rtn+"人批准，需要"+c+"人批准");
                else alert("您提交的修改已经有"+rtn+"人批准，需"+c+"人批准，已经生效");
            }
            //重置输入栏
            getNode("value").value="";
            getNode("key").value="";
            getNode("unit").selectedIndex = 0;
        }
        setLoading(0);
    };
})();