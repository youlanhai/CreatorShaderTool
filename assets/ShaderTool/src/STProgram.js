
let GLProgram = null;
if(CC_EDITOR){
	GLProgram = require("../../CCGLProgram");
}
else{
	GLProgram = cc.GLProgram;
}

export default function STProgram(id, variants, glContext){
	let self = null;
	let glProgram = null;

	function createGLProgram(vsh, fsh){
		if(CC_EDITOR){
			cc.assert(glContext !== null, "setGLContext first");
			glProgram = new GLProgram(null, null, glContext);
		}
		else{
			glProgram = new GLProgram();
		}

		if(!glProgram.initWithString(vsh, fsh)){
			cc.error("Failed create GLProgram:", id, variants);
			return false;
		}

		glProgram.link();
		glProgram.updateUniforms();
		return true;
	}

	function init(data){
		let strs = [];
		for(let key in variants){
			strs.push("#define " + variants[key]);
		}
		strs.push("\n");

		let defines = strs.join("\n");
		let vsh = defines + data.vsh;
		let fsh = defines + data.fsh;

		return createGLProgram(vsh, fsh);
	}

	self = {
		__cname : "STProgram",
		init : init,

		getID(){
			return id;
		},

		getGLProgram(){
			return glProgram;
		},
	}
	return self;
}
