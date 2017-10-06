import STShaderCache from "STShaderCache";
import STMaterialCache from "STMaterialCache";
import STShaderParser from "STShaderParser";

function setProgram (node, program) {
    node.setGLProgramState(program);

    var children = node.children;
    if (!children)
        return;

    for (var i = 0; i < children.length; i++)
        setProgram(children[i], program);
}

cc.Class({
    extends: cc.Component,

    properties: {
        "shaderPath" : "resources/test-shader.json",
        "materialPath" : "resources/test-material.json",
    },

    // use this for initialization
    onLoad: function () {
        cc.log("Test Shader ...");
        this.shader = STShaderCache.getOrCreate(this.shaderPath);
        cc.log("shader", this.shader, this.shader.filePath);

        let subshader = this.shader.matchSubshader();
        cc.log("matched subshader:", subshader);
        let program = subshader.getFirstPass().matchProgram(["ENABLE_SHADOW"]);
        cc.log("matched program:", program && program.getID());

        cc.log("Test Material ...");
        let material = STMaterialCache.getOrCreate(this.materialPath);
        if(!material.ifValiad()){
            cc.error("Failed load material", this.materialPath);
        }
        else{
            material.updateUniforms();

            let glProgramState = material.getActiveGLProgramState();
            cc.log("glProgramState", glProgramState);

            let ccnode = this.node._sgNode;
            setProgram(ccnode, glProgramState);
            //ccnode.setGLProgramState(glProgramState);
            if(ccnode.getGLProgramState() !== glProgramState){
                cc.error("Failed to set glProgramState");
            }
        }

        let parser = STShaderParser();
        parser.parseFile("resources/test-shader2.shader");
        parser.saveResult("resources/test-shader.json");
    },
});
