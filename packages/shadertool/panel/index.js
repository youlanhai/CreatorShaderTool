// panel/index.js, this filename needs to match the one registered in package.json
var MaterialEditor = Editor.require("packages://shadertool/MaterialEditor");

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
	width : 48%;
	height: 100%;
	float: right;
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
		<ui-box-container>
			<ui-label>Shader路径</ui-label>
			<ui-select id="inputShaderPath" style="width: 200px">
				<option value="0">测试0</option>
				<option value="1">测试1</option>
			</ui-select>
			<ui-button id="btnRefreshShader">刷新</ui-button>
		</ui-box-container>
		<ui-box-container>
			<table id=propertyTable>
				<tr> <td>名称</td> <td><ui-input>Hello World</ui-input></td> </tr>
				<tr> <td>ID</td> <td><ui-num-input>1000</ui-num-input></td> </tr>
			</table>
		</ui-box-container>
	</ui-section>
</div>
<div class="rightstyle">
	<ui-label>测试标签</ui-label>
	<ui-box-container>
		<canvas id="canvas" width="400" height="400"> my canvas </canvas>
	</ui-box-container>
</div>
`;

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
		inputShaderPath : '#inputShaderPath',
		propertyTable : '#propertyTable',
		btnRefreshShader : '#btnRefreshShader',
		canvas : '#canvas',
	},

	// method executed when template and styles are successfully loaded and initialized
	ready () {
		// creator有bug，ready的时候抛出的异常没有捕获，需要自己处理
		try{
			this.materialEditor = new MaterialEditor();
			this.materialEditor.init(this);
		}
		catch(e){
			Editor.error("Failed to init shader tool", e);
		}
	},

	// register your ipc messages here
	messages: {
		'shadertool:hello' (event) {
			this.$label.innerText = 'Hello!';
		}
	},
});
