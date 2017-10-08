import STShaderCache from "STShaderCache";
import STMaterialCache from "STMaterialCache";
import STShaderParser from "STShaderParser";

function setProgram (node, program) {
    node.setGLProgramState(program);

    var children = node.children;
    if (!children)
        return;

    for (var i = 0; i < children.length; i++){
        setProgram(children[i], program);
    }
}

cc.Class({
    extends: cc.Component,

    properties: {
        shaderPath : "resources/shaders/gray-compiled.json",
        materialPath : "resources/materials/gray.mtl",
    },

    // use this for initialization
    onLoad() {
        // creator暂时有bug，需要手动将纹理寻址模式改为repeat
        let texture = cc.textureCache.addImage(cc.url.raw("resources/textures/tex00.jpg"));
        if(texture){
            texture.setTexParameters(gl.LINEAR, gl.LINEAR, gl.REPEAT, gl.REPEAT);
        }

        this.testParser();

        this.testShader();

        this.testMaterial();
    },

    testShader(){
        cc.log("Test Shader ...");
        this.shader = STShaderCache.getOrCreate(this.shaderPath);
        cc.log("shader", this.shader, this.shader.filePath, this.shader.ifValiad());

        if(this.shader.ifValiad()){
            let subshader = this.shader.matchSubshader();
            cc.log("matched subshader:", subshader);
            let program = subshader.getFirstPass().matchProgram(["ENABLE_SHADOW"]);
            cc.log("matched program:", program && program.getID());
        }
    },

    testMaterial(){
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
    },

    testParser(){
        cc.log("Test Shader Parser ...");
        let parser = STShaderParser();
        parser.parseFile("resources/shaders/gray.shader");
        parser.saveResult("resources/shaders/gray-compiled.json");
    },
});
