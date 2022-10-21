(async function(){
    getNode("nihao").onclick=()=>{
        if (!checkConnect()) return;
        getToken();
    }
})();