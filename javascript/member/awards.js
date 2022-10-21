(function(){
	setNodeText("award-text",publicParam.member.awards);
	if (publicParam.member.address==publicParam.address){
        // 如果是用户本人，可以编辑
        var placeholder = "请输入您的成就和荣誉";
        var div = getNode("award-text");
		var txt = (publicParam.member.awards?publicParam.member.awards:placeholder);
        div.contentEditable = true;
        div.innerText=txt;
        div.tag = txt;
        div.onclick = function(){
            if (this.innerText == placeholder) this.innerText="";
        }
        // 离开就立刻保存，同时更新缓存数据
        div.onblur = function (){
            if (this.tag != this.innerText){
                publicParam.member.awards = this.innerText;
                var param = {
                    webapi:"updateMemberAwards",
                    awards:(publicParam.member.awards?publicParam.member.awards:""),
                }
                callAPI(param);
            }
            if (this.innerText=="") this.innerText=placeholder;
        };
    }
})();