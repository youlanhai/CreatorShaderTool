"use strict";

var _STShaderCache = require("STShaderCache");

var _STShaderCache2 = _interopRequireDefault(_STShaderCache);

var _STMaterialCache = require("STMaterialCache");

var _STMaterialCache2 = _interopRequireDefault(_STMaterialCache);

var _STShaderParser = require("STShaderParser");

var _STShaderParser2 = _interopRequireDefault(_STShaderParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function setProgram(node, program) {
    node.setGLProgramState(program);

    var children = node.children;
    if (!children) return;

    for (var i = 0; i < children.length; i++) {
        setProgram(children[i], program);
    }
}

cc.Class({
    extends: cc.Component,

    properties: {
        shaderPath: "resources/shaders/gray-compiled.json",
        materialPath: "resources/materials/gray.mtl"
    },

    // use this for initialization
    onLoad: function onLoad() {
        // creator暂时有bug，需要手动将纹理寻址模式改为repeat
        var texture = cc.textureCache.addImage(cc.url.raw("resources/textures/tex00.jpg"));
        if (texture) {
            texture.setTexParameters(gl.LINEAR, gl.LINEAR, gl.REPEAT, gl.REPEAT);
        }

        this.testParser();

        this.testShader();

        this.testMaterial();
    },
    testShader: function testShader() {
        cc.log("Test Shader ...");
        this.shader = _STShaderCache2.default.getOrCreate(this.shaderPath);
        cc.log("shader", this.shader, this.shader.filePath, this.shader.ifValiad());

        if (this.shader.ifValiad()) {
            var subshader = this.shader.matchSubshader();
            cc.log("matched subshader:", subshader);
            var program = subshader.getFirstPass().matchProgram(["ENABLE_SHADOW"]);
            cc.log("matched program:", program && program.getID());
        }
    },
    testMaterial: function testMaterial() {
        cc.log("Test Material ...");
        var material = _STMaterialCache2.default.getOrCreate(this.materialPath);
        if (!material.ifValiad()) {
            cc.error("Failed load material", this.materialPath);
        } else {
            material.updateUniforms();

            var glProgramState = material.getActiveGLProgramState();
            cc.log("glProgramState", glProgramState);

            var ccnode = this.node._sgNode;
            setProgram(ccnode, glProgramState);
            //ccnode.setGLProgramState(glProgramState);
            if (ccnode.getGLProgramState() !== glProgramState) {
                cc.error("Failed to set glProgramState");
            }
        }
    },
    testParser: function testParser() {
        cc.log("Test Shader Parser ...");
        var parser = (0, _STShaderParser2.default)();
        parser.parseFile("resources/shaders/gray.shader");
        parser.saveResult("resources/shaders/gray-compiled.json");
    }
});