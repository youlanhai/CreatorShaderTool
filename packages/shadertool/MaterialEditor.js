var fs = require("fs");
let STMaterial = require("./shaderTool/src/STMaterial").default;

var TYPE_2_UI_STYLE = {
	"float" : "ui-num-input",
	"int" : "ui-num-input",
	"texture" : "ui-asset",
	"color" : "ui-color",
};

var PropertyUIBase = cc.Class({

	init(name, property, inspector){
		this.inspector = inspector;
		this.property = property;
		this.uiRoot = null;
		this.uiName = null;
		this.uiValue = null;
		this.name = name;

		var type = property["type"];
		this.valueUIName = TYPE_2_UI_STYLE[type] || "ui-input";
		return true;
	},

	setValue(value){
		this.uiValue.value = value;
	},

	getValue(){
		return this.uiValue.value;
	},

	onValueChange(){
		this.inspector.onPropertyChange(this.name, this.getValue());
	},

	createNameUI(){
		var node = document.createElement("ui-label");
		node.innerText = this.property["desc"];
		return node;
	},

	createValueUI(){
		var self = this;
		var node = document.createElement(this.valueUIName);
		node.addEventListener("change", function(){
			self.onValueChange();
		});
		return node;
	},

	createUI(){
		this.uiRoot = document.createElement("tr");

		var td = null;
		td = document.createElement("td");
		this.uiRoot.appendChild(td);
		this.uiName = this.createNameUI();
		td.appendChild(this.uiName);
		
		td = document.createElement("td");
		this.uiRoot.appendChild(td);
		this.uiValue = this.createValueUI();
		td.appendChild(this.uiValue);

		this.setValue(this.property["default"]);
		return this.uiRoot;
	},
});

var PropertyUIColor = cc.Class({
	extends : PropertyUIBase,

	setValue(cr){
		this.uiValue.value = [cr[0], cr[1], cr[2], cr[3] / 255];
	},

	getValue(){
		let cr = this.uiValue.value;
		return [cr[0], cr[1], cr[2], Math.floor(cr[3] * 255)];
	},
})

var PropertyUITexture = cc.Class({
	extends : PropertyUIBase,

	createValueUI(){
		var node = document.createElement(this.valueUIName);
		node.setAttribute("type", "texture");
		node.setAttribute("style", "width: 200px;margin-top:20px");
		node.addEventListener("change", ()=>{
			this.onValueChange();
		});
		return node;
	},
})

var TYPE_2_UI_CLASS = {
	"float" : PropertyUIBase,
	"int" : PropertyUIBase,
	"string" : PropertyUIBase,
	"texture" : PropertyUITexture,
	"color" : PropertyUIColor,
};

function removeAllChildren(node){
	while(node.firstChild){
		node.removeChild(node.firstChild);
	}
}

// 材质编辑器
module.exports = cc.Class({
	style: STYLE,
	template: TEMPLATE,

	init(panel){
		this.panel = panel;
		this.propertyTable = panel.$propertyTable;
		this.inputShaderPath = panel.$inputShaderPath;
		this.canvas = panel.$canvas;

		panel.$btnOpen.addEventListener("click", this.onBtnOpen.bind(this));
		panel.$btnSave.addEventListener("click", this.onBtnSave.bind(this));
		panel.$btnSaveAs.addEventListener("click", this.onBtnSaveAs.bind(this));
		panel.$btnNew.addEventListener("click", this.onBtnNew.bind(this));
		panel.$btnRefreshShader.addEventListener("clieck", this.refreshSahderList.bind(this));

		this.inputShaderPath.addEventListener("change", this.onShaderPathChange.bind(this));

		this.material = null;
		this.propertiesUI = {};

		let properties = {
			"MainTex" : {
				"desc" : "主纹理",
				"type" : "texture",
				"default" : "test/test",
			},
			"Alpha" : {
				"desc" : "Alpha",
				"type" : "float",
				"default" : 0,
			},
		}

		this.createInspector(properties);
		this.refreshSahderList();

		this.initGL();
	},

	createInspector(properties){
		this.clearPropertiesUI();

		let parentNode = this.propertyTable;
		for(let key in properties){
			let prop = properties[key];
			let type = prop["type"];

			let cls = TYPE_2_UI_CLASS[type];
			if(!cls){
				Editor.error("Failed find property ui class for type", type);
				continue;
			}

			let propertyUI = new cls();
			if(!propertyUI.init(key, prop, this)){
				Editor.error("Failed init property ui for", key);
				continue;
			}

			this.propertiesUI[key] = propertyUI;

			let node = propertyUI.createUI();
			parentNode.appendChild(node);
		}
	},

	clearPropertiesUI(){
		removeAllChildren(this.propertyTable);
		this.propertiesUI = {};
	},

	loadMaterial(path){
		
		let material = new STMaterial(this.glContext);
		if(!material.init(path)){
			return Editor.Dialog.messageBox({
				type : "error",
				content : "加载文件失败",
			})
		}

		this.material = material;
		this.inputShaderPath.value = material.shaderPath;
		this.createInspector(material.properties);

		let values = material.values;
		for(let key in values){
			let propertyUI = this.propertiesUI[key];
			if(propertyUI){
				propertyUI.setValue(values[key]);
			}
		}

		this.draw();
	},

	onPropertyChange(key, value){
		// Editor.log("onPropertyChange", key, value);

		if(this.material){
			this.material.setValue(key, value);
		}
		
		this.draw();
	},

	onBtnNew(){

	},
	
	onBtnOpen(){
		let options = {
			title : "打开材质",
			filters : [
				{name: "material", extensions : ["mtl"]}
			],
		};
		let files = Editor.Dialog.openFile(options);
		if(files.length > 0){
			Editor.log("open", files[0]);
			this.loadMaterial(files[0]);
		}
	},

	onBtnSave(){
		if(!this.material){
			return;
		}

		if(!this.material.save()){
			return Editor.Dialog.messageBox({
				type : "error",
				content : "保存失败",
			})
		}
		Editor.log("save", this.material.filePath);
	},

	onBtnSaveAs(){

	},

	onShaderPathChange(){
		let index = this.inputShaderPath.value;
		Editor.log("shader path", index, this.shaderPaths[index]);
	},

	createShaderOption(index, name){
		let node = document.createElement("option");
		node.setAttribute("value", index);
		node.innerText = name;
		this.inputShaderPath.appendChild(node);
	},

	refreshSahderList(){
		removeAllChildren(this.inputShaderPath);

		let path = cc.url.raw("resources/shaders");
		Editor.log("refresh shader:", path);

		let files = fs.readdirSync(path);
		let shaderPaths = [];
		for(let i in files){
			let name = files[i];
			if(name.length > 7 && name.substr(name.length - 7) === ".shader"){
				name = name.substr(0, name.length - 7);
				shaderPaths.push(name);
			}
		}

		this.shaderPaths = shaderPaths;
		shaderPaths.sort();
		for(let i = 0; i < shaderPaths.length; ++i){
			let name = shaderPaths[i];
			this.createShaderOption(i, name);
		}
	},

	initGL(){
		let canvas = this.canvas;
		let gl = canvas.getContext("webgl");
		if(!gl){
			return Editor.error("Failed to get webgl");
		}
		this.glContext = gl;

		gl.clearColor(0, 0, 0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.viewport(0, 0, canvas.width, canvas.height);

		let hw = 0.5;
		let hh = 0.5;
		let vertices = [
			// left top
			-hw, hh, 0,
			0, 0,
			// left bottom
			-hw, -hh, 0,
			0, 1,
			// right top
			hw, hh, 0,
			1, 0,
			// right bottom
			hw, -hh, 0,
			1, 1,
		];

		let vb = gl.createBuffer();
		this.vertexBuffer = vb;

		gl.bindBuffer(gl.ARRAY_BUFFER, vb);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	},

	draw(){
		if(!this.material){
			return;
		}

		let gl = this.glContext;
		gl.clear(gl.COLOR_BUFFER_BIT);

		this.material.use();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

		let VERTS_BYTE_LENGTH = (3 + 2) * 4;

        gl.enableVertexAttribArray(cc.macro.VERTEX_ATTRIB_POSITION);
        gl.enableVertexAttribArray(cc.macro.VERTEX_ATTRIB_TEX_COORDS);
        gl.vertexAttribPointer(cc.macro.VERTEX_ATTRIB_POSITION, 3, gl.FLOAT, false, VERTS_BYTE_LENGTH, 0);
        gl.vertexAttribPointer(cc.macro.VERTEX_ATTRIB_TEX_COORDS, 2, gl.FLOAT, false, VERTS_BYTE_LENGTH, 12);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	},
});
