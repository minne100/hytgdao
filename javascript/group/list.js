(function(){
    publicParam.groupSize = 20;
    /**
    * 初始化
    */
	async function init(){
        if (!checkConnect()) return;
        var rtn = await loadManbers();
        if (rtn){
            if (!publicParam.groups){
                setLoading(1);
                publicParam.groupsNum = await numOfGroup();
            }
            if(!publicParam.groupPage) publicParam.groupPage = 0;
            //如果提案数多于每页显示的数量，则显示分页按钮
            if(publicParam.groupsNum>publicParam.groupSize){
                var param = {
                    total:publicParam.groupsNum,
                    size:publicParam.groupSize,
                    current:publicParam.groupPage,
                    fn:load,
                };
                loadPage("/common/paging","paging",param);
            }
            load(publicParam.groupPage);
            getNode("refresh").onclick = ()=>{
                //强制刷新
                publicParam.groups = null;
                publicParam.groupPage = 0;
                init();
            }
        }
    }
    /**
    * 为了分页每次载入一定量的小组
    */
	async function load(paging){
        setLoading(1);
        publicParam.groupPage = paging;
        publicParam.groups = await getGroupFromTo();
        loadPage("/group/listItem","list");
        setLoading(0);
    }
	init();
})();