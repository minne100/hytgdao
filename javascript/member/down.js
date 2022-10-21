(function(){
    var memberList = getNode("memberList");
    if (publicParam.member.down.length==0) {
        //如果没有介绍过会员，就不显示。
        memberList.children[0].style.display="none";
        return;
    }
    var row = memberList.children[0];
    //清除节点
    clearAll(memberList);
    for(var i=0;i<publicParam.member.down.length;i++){
        //获取会员
        var m = getMemberByAddress(publicParam.member.down[i]);
        //复制节点
        var newRow = row.cloneNode(true);
        newRow.style.display="";
        //不使用getNode，因为那个是在全页面搜索，会找到相同的ID
        var name = getSubNode(newRow,"name");
        name.innerText = m.name;
        var joinTime = getSubNode(newRow,"joinTime");
        joinTime.innerText = m.joinTime;
        var about = getSubNode(newRow,"about");
        about.innerText = m.about;
        var photo = getSubNode(newRow,"photo");
        if (m.photo) photo.src=m.photo;
        else photo.src="/images/my.png";
        //设置传递的参数
        newRow.tag = m.address;
        newRow.onclick=function(){
            //跳转页面并传参
            goto("member/info",this.tag);
        };
        memberList.appendChild(newRow);
    }
})();