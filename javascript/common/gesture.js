(function(){
	//暂时没用到，主要是在Iphone上拖动会有橡皮筋效果，会影响定位，导致无法准确判断画在哪里。
	var canvas = getNode("canvas");
	var ctx = canvas.getContext('2d');
	var x=-1,y=-1;
	var rtn = "";
	var w = canvas.width;
	var h = canvas.height;
	var l,t;
	var s = w/4;
	password = null;
	publicParam.gestureRenew = renew;
	//主要用于屏幕旋转后的重定位
	window.onresize = resize;
	//设置鼠标和触摸事件
	canvas.addEventListener('mousedown', mouseDown,false);
	canvas.addEventListener('touchstart', mouseDown,false);
	canvas.addEventListener('mouseup',mouseUp,false);
	canvas.addEventListener('touchend',mouseUp,false);
	canvas.addEventListener('mousemove',mouseMove,false);
	canvas.addEventListener('touchmove',mouseMove,false);
	canvas.addEventListener('mouseout',mouseUp,false);
	resize();
	renew();
    /**
    * 清空
    */
	function renew(){
	    ctx.clearRect(0, 0, w, h);
		for(var i=1;i<4;i++){
			drowLine("white", s*i, 0, s*i, w);
			drowLine("white", 0, s*i, w, s*i);
		}
		for(var i=0;i<4;i++){
			for(var j=0;j<4;j++){
				drowPoint("white",5,i,j);
			}
		}
	}
    /**
    * 旋转屏幕之后重新定位
    */
	function resize(){
		var rect = canvas.getBoundingClientRect();
		l = rect.left;
		t = rect.top;
		alert(l+" * "+t);
	}
    /**
    * 画一条线
    */
	function drowLine(color,x1,y1,x2,y2){
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = color;
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
		ctx.stroke();
	}
    /**
    * 画一个实心圆
    */
	function drowPoint(color,size,x,y){
		ctx.beginPath();
		ctx.arc(x*s+s/2, y*s+s/2, size, 0, Math.PI*2, true);
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();			
	}
    /**
    * 鼠标或触屏按下
    */
	function mouseDown(e){
		var p = getXY(e);
		if (p){
			x = p.x;
			y = p.y;
			rtn = String.fromCharCode(65+x*4+y);
			drowPoint("red",10,x,y);
		}
	};
    /**
    * 鼠标或触屏放开
    */
	function mouseUp(e){
		if (x>-1 && y>-1){
			x=-1;
			y=-1;
			//执行回调，返回密码
			publicParam.getGesture(rtn);
		}
	};
    /**
    * 鼠标或触屏移动
    */
	function mouseMove(e){
		if (x>-1 && y>-1){
			//只有按下的位置在某个圆点上之后的移动才起作用
			var p = getXY(e);
			if (p && (x != p.x || y != p.y)){
				//不是之前的圆点
				drowLine("red", s*x+s/2, s*y+s/2, s*p.x+s/2, s*p.y+s/2);
				x = p.x;
				y = p.y;
				//添加一位密码
				rtn += String.fromCharCode(65+x*4+y);
				drowPoint("red",10,x,y);
			}
		}
	};
    /**
    * 根据鼠标或触屏位置获取在哪个圆点的范围内
    */
	function getXY(e){
		e.preventDefault();
		var x,y;
		//根据鼠标和手势，分别获取屏幕位置
		if (e.clientX) x = e.clientX;
		else x = e.changedTouches[0].pageX;
		if (e.clientY) y = e.clientY;
		else y = e.changedTouches[0].pageY;
		x -= l;
		y -= t;
		//确定在哪个格子里
		var i = Math.floor(x/s);
		var j = Math.floor(y/s);
		//判断是否出界
		if (i>=0 && i<4 && j>=0 && j<4){
			//圆心的xy
			var cx = i*s+s/2;
			var cy = j*s+s/2;
			//距离圆心的距离
			var rx = x-cx;
			var ry = y-cy;
			//判断是否在格子中心70%直径内
			if (Math.sqrt(rx*rx+ry*ry)<=s*0.35)
				return {x:i,y:j};
		}
		return null;
	};
})();