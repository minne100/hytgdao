(async function(){
    if (!checkConnect()) return;
    var rtn = await loadManbers();
    if (rtn){
        setLoading(1);
        publicParam.groups = await getMyGroup();
        loadPage("/group/listItem","list");
        setLoading(0);
        getNode("refresh").onclick = ()=>{
            publicParam.groups = null;
            init();
        }
    }
})();