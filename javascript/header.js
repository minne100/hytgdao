(function(){
	/**
	* 初始化
	*/
	function init(){
		//允许直接显示指定的子页面
		var home = "home";
		var page = getNode("header.js").tag;
		if (page) home = page;

		//根据宽度判读是否显示菜单按钮
		display("menuButton",!isDisplay("mainMenu"));
		//设定边栏菜单
		setMenu()
		//载入使用何种钱包的设定
		publicParam.usewallet = loadItem("usewallet");
		//找到连接钱包的按钮
		let wallet = getNode("wallet");
		if(publicParam.usewallet){
			//指定过钱包
			if (publicParam.usewallet=="metamask"){
				wallet.innerText = "连接钱包";
				//使用matemask钱包，async方法无法用trycatch捕捉
				getAddress().then(()=>{
					publicParam.walletConnected = true;
				}).catch(()=>{
					wallet.onclick=async function(){
						var rtn = await connectMetamask();
						if (rtn) goto(home);
						else alert("请切换到Polygon网络");
					}
				});
			}else{
				//使用内置钱包
				if(loadItem("web3js_wallet")){
					wallet.innerText = "连接钱包";
					wallet.onclick=()=>{
						goto("wallet/login");
					}
				}else{
					wallet.innerText = "创建钱包";
					wallet.onclick=()=>{
						goto("wallet/addnew");
					};
				}
			}
		}else{
			//没指定过钱包
			if (window.ethereum){
				//如果浏览器安装了Metamask插件，优先使用
				publicParam.usewallet="metamask";
				saveItem("usewallet",publicParam.usewallet);
				wallet.innerText = "连接钱包";
				wallet.onclick=connectWallet;
			}else{
				//否则就引导用户创建一个内置钱包
				publicParam.usewallet="builtIn";
				saveItem("usewallet",publicParam.usewallet);
				wallet.innerText = "创建钱包";
				wallet.onclick=()=>{
					goto("wallet/addnew");
				};
			}
		}
		//重新加载次页面时，将之前设置的
		setOnclick(getNode("content"));
		setMenuClick(getNode("mobile-menu"));
		/*本来是可以切换主题颜色的，可是不知什么原因，换成亮色就切不回来了，因此暂时关闭此功能
		getNode("chk").onclick=()=>{
			var html = document.body.parentNode;
			if (html.dataset.theme == "light"){
				html.style.colorScheme = "dack";
				html.dataset.theme = "dack";
				saveItem("theme","dack");
			}else{
				html.style.colorScheme = "light";
				html.dataset.theme = "light";
				saveItem("theme","light");
			}
		};
		*/
		//显示页脚的年号
		getNode("copyright").innerText = copyright.innerText.replace("*",new Date().getFullYear());
		//显示或隐藏菜单栏
		getNode("menuButton").onclick = function(){
			var menu=getNode("menu");
			if (menu.style.right="-495px"){
				menu.style.right="0px";
			}else{
				menu.style.right="-495px";
			}
		};
		getNode("closeMenu").onclick = closeMenu;
		goto(home);		  
	}

	/**
	* 设置页面中所有的菜单跳转
	*/
	function setOnclick(node){
		for(var i=0;i<node.children.length;i++){
			if (node.children[i].dataset.path){
				node.tag = node.children[i].dataset.path;
				node.onclick = function(){
					closeMenu();
					goto(this.tag);
				};
			}
			if(node.children[i].children.length>0) {
			  setOnclick(node.children[i]);
			}
		}
	}

	/**
	* 设置边栏菜单中所有的展开按钮事件
	*/
	function setMenuClick(node){
		for(var i=0;i<node.children.length;i++){
			if (node.children[i].id.substr(0,19)=="collapsible-trigger"){
				node.children[i].onclick = function(){
					var style = getNode("collapsible-content"+this.id.substr(19)).style;
					if(style.height) style.height="";
					else style.height="0px";
				};
			}
			if(node.children[i].children.length>0) {
				setMenuClick(node.children[i]);
			}
		}
	}

	/**
	* 关闭菜单列表
	*/
	function closeMenu(){
		getNode("menu").style.right="-495px";
	}

	/**
	* 根据主菜单复制边栏菜单
	*/
	function setMenu(){
		//主菜单
		const menu = getNode("mainMenu").children[0].children[0].children[0];
		//边栏菜单
		var mobile = getNode("mobile-menu").children[0];
		for(var i=0;i<menu.children.length;i++){
			var div = newNode("div");
			mobile.appendChild(div);
			if (menu.children[i].children.length==1){
				div.className="single_link iconAdd";
				var li = menu.children[i].cloneNode(true);
				div.appendChild(li);
			}else{
				div.className="Collapsible";
				//子菜单名
				var div1 = newNode("div");
				div.appendChild(div1);
				div1.className="Collapsible__trigger is-closed  iconAdd";
				div1.id="collapsible-trigger-"+i;
				div1.setAttribute("aria-axpanded",false);
				div1.setAttribute("aria-disabled",false);
				div1.role="button";
				div1.appendChild(menu.children[i].children[0].cloneNode(true));
				//子菜单内容
				var div2 = newNode("div");
				div.appendChild(div2);
				div2.className="Collapsible__contentOuter";
				div2.id="collapsible-content-"+i;
				div2.role="region";
				div2.style="height: 0px; transition: height 400ms linear 0s; overflow: hidden;";
				var div3 = newNode("div");
				div3.className="Collapsible__contentInner";
				div2.appendChild(div3);
				var ul = newNode("ul");
				ul.className="sidebar_sub_menu submenu text-black";
				div3.appendChild(ul);
				for(var j=0;j<menu.children[i].children[1].children.length;j++){
					ul.appendChild(menu.children[i].children[1].children[j].cloneNode(true));
				}
			}
		}
	}
	init();
})();