(function(){
	//为所有字段设置已有的值
	setNodeText("role",publicParam.member.role);
	setNodeText("about",publicParam.member.about);
	setNodeText("skill",publicParam.member.skill);
	setNodeText("email",publicParam.member.email);
	setNodeText("wechat",publicParam.member.wechat);
	setNodeText("phone",publicParam.member.phone);
	//如有照片则显示
	if (publicParam.member.photo){
		getNode("photo").src = publicParam.member.photo;
	}
	//如果显示的是自己的信息，则允许编辑
	if (publicParam.member.address==publicParam.address){
		setEditable("role",publicParam.member.role,"请输入你在组织中的角色");
		setEditable("about",publicParam.member.about,"请输入100字以内的简介");
		setEditable("skill",publicParam.member.skill,"请输入");
		setEditable("email",publicParam.member.email,"请输入");
		setEditable("wechat",publicParam.member.wechat,"请输入");
		setEditable("phone",publicParam.member.phone,"请输入");
		//允许上传照片
		getNode("photo").onclick=function(){
			getNode("asset").click();
		};
	}
	//选中照片
	getNode("asset").onchange=function(){
		try{
			//读取文件
			var reader = new FileReader();
			reader.readAsDataURL(this.files[0]);
			reader.onloadend = function () {
				//读取文件成功
				var newImg = new Image();
				newImg.src = reader.result;
				newImg.onload = function(){
					if(newImg.width<400 || newImg.height<400){
						alert("图片不可小于400*400");
						return;
					}
					//对图片进行加工，使其成为正向400X400的JPG
					var dataurl = getImagePortion(newImg,400);
					//显示预览图片
					getNode("photo").src = dataurl;
					//上传图片
					callAPI({webapi:"uploadImg",file:dataurl});
				}; 
			};
		}catch(e){
			alert("文件格式错误");
		}
	};
	/**
	* 将指定节点设置为可编辑
	*/
	function setEditable(name,txt,placeholder){
		var div = getNode(name);
		div.contentEditable = true;
		if (txt=="") div.innerText=placeholder;
		else div.innerText=txt;
		//保留原始数据
		div.tag = txt;
		div.placeholder = placeholder;
        div.onclick = function(){
            if (this.innerText == placeholder) this.innerText="";
        }
		//失去焦点时自动保存
		div.onblur=updateData;
	}
	/**
	* 在服务器上保存数据
	*/
	function updateData(){
		if (this.tag != this.innerText){
			//有变化才更新
			if (this.id=="about" && this.innerText.length>100){
				alert("简介请不要超过100字，目前为"+this.innerText.length+"字");
				return;
			}
			//更新缓存中的数据
			publicParam.member[this.id] = this.innerText;
			//提交给服务器的数据，这些数据无关紧要都保存在传统数据库中
			var param = {
				webapi:"updateMember",
				role:(publicParam.member.role?publicParam.member.role:""),
				about:(publicParam.member.about?publicParam.member.about:""),
				skill:(publicParam.member.skill?publicParam.member.skill:""),
				email:(publicParam.member.email?publicParam.member.email:""),
				wechat:(publicParam.member.wechat?publicParam.member.wechat:""),
				phone:(publicParam.member.phone?publicParam.member.phone:"")
			}
			callAPI(param);
		}
		if (this.innerText == "") this.innerText = this.placeholder;
	}
	/**
	* 由于手机拍的照片会保存拍摄时的角度，所以需要先调正，并且自动剪切中间的部分后缩小。
	* 以后可以考虑加上手动选择剪裁范围的功能，目前只能指定剪裁大小
	*/
	function getImagePortion(imgObj,size){
		var arrayBuffer = base64ToArrayBuffer(imgObj.src);
		//获取图片的角度
		var o = getOrientation(arrayBuffer);
		//旋转用的画布
		var tnCanvas = document.createElement('canvas');
		var tnCanvasContext = tnCanvas.getContext('2d');
		tnCanvas.width = size;
		tnCanvas.height = size;
		//原来的尺寸
		var l=0,t=0;
		var w = imgObj.width;
		var h = imgObj.height;
		//剪切缩放用的画布
		var bufferCanvas = document.createElement('canvas');
		var bufferContext = bufferCanvas.getContext('2d');
		bufferCanvas.width = size;
		bufferCanvas.height = size;
		if (w > h){
			l = (w-h)/2;
			w=h;
		}else{
			t = (h-w)/2;
			h=w;
		}
		bufferContext.drawImage(imgObj, l,t,w,h,0,0,size,size);
		//旋转
		switch(o){
		  case 6:
				tnCanvasContext.rotate(Math.PI / 2);
				tnCanvasContext.drawImage(bufferCanvas, 0, -size,size,size);
		  break;
		  case 3:
				tnCanvasContext.rotate(Math.PI);
				tnCanvasContext.drawImage(bufferCanvas, -size, -size,size,size);
		  break;
		  case 8:
				tnCanvasContext.rotate(3 * Math.PI / 2);
				tnCanvasContext.drawImage(bufferCanvas, -size, 0,size,size);
		  break;
		  default:
				tnCanvasContext.drawImage(bufferCanvas,0,0);
		  break;
	  }
	  //返回处理好的图像
	  return tnCanvas.toDataURL("image/jpeg", 1.0);
	}	
	/**
	* 从元数据中获取照片拍摄时的角度
	* 从网上找的，仅对JPG格式有效
	*/
	function getOrientation(arrayBuffer) {
	  var dataView = new DataView(arrayBuffer);
	  var length = dataView.byteLength;
	  var orientation=1;
	  var exifIDCode;
	  var tiffOffset;
	  var firstIFDOffset;
	  var littleEndian;
	  var endianness;
	  var app1Start;
	  var ifdStart;
	  var offset;
	  var i;
	  // Only handle JPEG image (start by 0xFFD8)
	  if (dataView.getUint8(0) === 0xFF && dataView.getUint8(1) === 0xD8) {
	    offset = 2;
	    while (offset < length) {
	      if (dataView.getUint8(offset) === 0xFF && dataView.getUint8(offset + 1) === 0xE1) {
	        app1Start = offset;
	        break;
	      }
	      offset++;
	    }
	  }
	  if (app1Start) {
	    exifIDCode = app1Start + 4;
	    tiffOffset = app1Start + 10;
	    if (getStringFromCharCode(dataView, exifIDCode, 4) === 'Exif') {
	      endianness = dataView.getUint16(tiffOffset);
	      littleEndian = endianness === 0x4949;

	      if (littleEndian || endianness === 0x4D4D /* bigEndian */) {
	        if (dataView.getUint16(tiffOffset + 2, littleEndian) === 0x002A) {
	          firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);

	          if (firstIFDOffset >= 0x00000008) {
	            ifdStart = tiffOffset + firstIFDOffset;
	          }
	        }
	      }
	    }
	  }
	  if (ifdStart) {
	    length = dataView.getUint16(ifdStart, littleEndian);

	    for (i = 0; i < length; i++) {
	      offset = ifdStart + i * 12 + 2;
	      if (dataView.getUint16(offset, littleEndian) === 0x0112 /* Orientation */) {

	        // 8 is the offset of the current tag's value
	        offset += 8;

	        // Get the original orientation value
	        orientation = dataView.getUint16(offset, littleEndian);

	        break;
	      }
	    }
	  }
	  return orientation;
	}
	/**
	* 上面那个方法内部使用的，具体作用没仔细研究
	*/
	function getStringFromCharCode(dataView, start, length) {
	  var str = '';
	  var i;
	  for (i = start, length += start; i < length; i++) {
	    str += String.fromCharCode(dataView.getUint8(i));
	  }
	  return str;
	}
	/**
	* 将base64格式的转为图像
	* 不知道为什么用FileReader读进来的图像不是点阵而是Baes64，所以要先转换一下，
	* 也是内部函数
	*/
	function base64ToArrayBuffer(base64) {
	  base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
	  var binary = atob(base64);
	  var len = binary.length;
	  var buffer = new ArrayBuffer(len);
	  var view = new Uint8Array(buffer);
	  for (var i = 0; i < len; i++) {
	    view[i] = binary.charCodeAt(i);
	  }
	  return buffer;
	}
})();