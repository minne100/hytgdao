(function(){
    //获取参数
    const param = getNode("paging.js").tag;
    //当前页码
    var current = param.current;
    //回调函数
    var fn = param.fn;
    //总页数
    var pages = Math.ceil(param.total/param.size);
    var page = getNode("page");
    page.tag = 0;
    page.id = "page0";
    //设置所有的页码
    for(var i=1;i<pages;i++){
        var newPage = page.cloneNode(true);
        newPage.id = "page"+i;
        newPage.tag = i;
        newPage.children[0].innerText=(i+1);
        page.parentNode.insertBefore(newPage,getNode("next"));
    }
    /**
    * 通过ID设置节点是否可见，覆盖了main中的display，因为如果设为block会导致按钮换行
    */
    function display(name,b){
        var div = getNode(name);
        if (b) div.style.display="";
        else div.style.display="none";
    }    
    /**
    * 重新设置显示的按钮和颜色，以及点击事件
    */
    function reset(){
        display("prev",current>0);
        display("next",current<pages-1);
        var ul = getNode("page0").parentNode;
        for(var i=1;i<=pages;i++){
            var li = ul.children[i];
            if (current==i-1) {
                li.children[0].className="current";
                li.onclick=null;
            }else{
                li.children[0].className="";
                li.onclick=function(){
                    current = this.tag;
                    reset();
                    fn(current);
                };
            }
        }
    }
    //向前翻页按钮
    getNode("prev").onclick=()=>{
        current--;
        reset();
        fn(current);
    };
    //向后翻页按钮
    getNode("next").onclick=()=>{
        current++;
        reset();
        fn(current);
    };
    reset();
})();