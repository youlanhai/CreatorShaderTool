// panel/index.js, this filename needs to match the one registered in package.json

var STYLE = `
html,body{
	margin:0px;
	height:100%;
}
:host { margin: 5px; }
h2 { color: #f90; }
.leftstyle{
	width: 51%;
	float: left;
	border-right: 2px solid black;
	height: 100%;
	-webkit-overflow-scrolling: touch;
		overflow: auto;
		overflow-x: auto;
		overflow-y: auto;
}
.rightstyle{
	width : 49%;
	height: 100%;
	float: left;
}
.scrollview{
	-webkit-overflow-scrolling: touch;
	overflow: auto;
		overflow-x: auto;
		overflow-y: auto;
}
`;

var TEMPLATE = `
<div class="leftstyle">
	<ui-section>
		<div class="header"><h2>材质编辑器</h2></div>
		<div>
			<ui-button id="btnOpen">打开</ui-button>
			<ui-button id="btnSave">保存</ui-button>
			<ui-button id="btnSaveAs">另存</ui-button>
			<ui-button id="btnNew">新建</ui-button>
		</div>
		<table id=propertyTable>
			<tr> <td>名称</td> <td><ui-input>Hello World</ui-input></td> </tr>
			<tr> <td>ID</td> <td><ui-num-input>1000</ui-num-input></td> </tr>
		</table>
	</ui-section>
</div>
<div class="rightstyle">
	<canvas id="canvas" width="400" height="400"> my canvas </canvas>
</div>
`;

var TYPE_2_UI_STYLE = {
	"float" : "ui-num-input",
	"int" : "ui-num-input",
	"texture" : "ui-input",
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

var TYPE_2_UI_CLASS = {
	"float" : ProperyUIBase,
	"int" : ProperyUIBase,
	"string" : ProperyUIBase,
	"texture" : ProperyUIBase,
};

Editor.Panel.extend({
	style: STYLE,
	template: TEMPLATE,

	// element and variable binding
	$: {
		// btn: '#btn',
		// label: '#label',
		btnOpen : '#btnOpen',
		btnSave : '#btnSave',
		btnSaveAs : '#btnSaveAs',
		btnNew : '#btnNew',
		propertyTable : '#propertyTable',
	},

	// method executed when template and styles are successfully loaded and initialized
	ready () {
		// this.$btn.addEventListener('confirm', () => {
		//   Editor.Ipc.sendToMain('shadertool:clicked');
		// });

		try{
			this.init();
		}
		catch(e){
			Editor.log("Failed to init shader tool", e);
		}
	},

	init(){
		this.$btnOpen.addEventListener("click", this.onBtnOpen.bind(this));
		this.$btnSave.addEventListener("click", this.onBtnSave.bind(this));
		this.$btnSaveAs.addEventListener("click", this.onBtnSaveAs.bind(this));
		this.$btnNew.addEventListener("click", this.onBtnNew.bind(this));

		this.createInspector();
	},

	createInspector(){
		this.clearPropertiesUI();

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

		let parentNode = this.$propertyTable;
		for(let key in properties){
			let prop = properties[key];
			let type = prop["type"];

			let cls = TYPE_2_UI_CLASS[type];
			if(!cls){
				Editor.log("Failed find property ui class for type", type);
				continue;
			}

			let propertyUI = new ProperyUIBase();
			if(!propertyUI.init(key, prop, this)){
				Editor.log("Failed init property ui for", key);
				continue;
			}

			let node = propertyUI.createUI();
			parentNode.appendChild(node);
		}
	},

	clearPropertiesUI(){
		let node = this.$propertyTable;
		while(node.firstChild){
			node.removeChild(node.firstChild);
		}
	},

	// register your ipc messages here
	messages: {
		'shadertool:hello' (event) {
			this.$label.innerText = 'Hello!';
		}
	},

	onPropertyChange(key, value){
		Editor.log("onPropertyChange", key, value);
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
		}
	},

	onBtnSave(){
		Editor.log("save");
	},

	onBtnSaveAs(){

	}
});
