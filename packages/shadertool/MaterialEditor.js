// panel/index.js, this filename needs to match the one registered in package.json
var fs = require("fs");
let STMaterial = require("./shaderTool/src/STMaterial").default;

var TYPE_2_UI_STYLE = {
	"float" : "ui-num-input",
	"int" : "ui-num-input",
	"texture" : "ui-input",
	"color" : "ui-color",
};

var ProperyUIBase = cc.Class({

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

var ProperyUIColor = cc.Class({
	extends : ProperyUIBase,

	setValue(cr){
		this.uiValue.value = [cr[0], cr[1], cr[2], cr[3] / 255];
	},

	getValue(){
		let cr = this.uiValue.value;
		return [cr[0], cr[1], cr[2], Math.floor(cr[3] * 255)];
	},
})

var TYPE_2_UI_CLASS = {
	"float" : ProperyUIBase,
	"int" : ProperyUIBase,
	"string" : ProperyUIBase,
	"texture" : ProperyUIBase,
	"color" : ProperyUIColor,
};

// 材质编辑器
module.exports = cc.Class({
	style: STYLE,
	template: TEMPLATE,

	init(panel){
		this.panel = panel;
		this.propertyTable = panel.$propertyTable;

		panel.$btnOpen.addEventListener("click", this.onBtnOpen.bind(this));
		panel.$btnSave.addEventListener("click", this.onBtnSave.bind(this));
		panel.$btnSaveAs.addEventListener("click", this.onBtnSaveAs.bind(this));
		panel.$btnNew.addEventListener("click", this.onBtnNew.bind(this));

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
		let node = this.propertyTable;
		while(node.firstChild){
			node.removeChild(node.firstChild);
		}
		this.propertiesUI = {};
	},

	loadMaterial(path){
		
		let material = new STMaterial();
		if(!material.init(path)){
			return Editor.Dialog.messageBox({
				type : "error",
				content : "加载文件失败",
			})
		}

		this.material = material;
		this.createInspector(material.properties);

		let values = material.values;
		for(let key in values){
			let propertyUI = this.propertiesUI[key];
			if(propertyUI){
				propertyUI.setValue(values[key]);
			}
		}
	},

	onPropertyChange(key, value){
		Editor.log("onPropertyChange", key, value);

		if(this.material){
			this.material.setValue(key, value);
		}
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

	}
});
