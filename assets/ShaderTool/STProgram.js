
export default function STProgram(id, variants){
	let self = null;
	let glProgramState = null;
	let glProgram = null;

	function init(data){
		let strs = [];
		for(let key in variants){
			strs.push("#define " + variants[key]);
		}
		strs.push("\n");

		let defines = strs.join("\n");
		let vsh = defines + data.vsh;
		let fsh = defines + data.fsh;

		glProgram = new cc.GLProgram();
		if(!glProgram.initWithString(vsh, fsh)){
			return false;
		}

		glProgram.link();
		glProgram.updateUniforms();
		glProgram.use();

		glProgramState = cc.GLProgramState.getOrCreateWithGLProgram(glProgram);
		return true;
	}

	function clone(){
		let ret = STProgram(id, variants);
		ret._copy(glProgram, cc.GLProgramState.create(glProgram));
		return ret;
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

		getGLProgramState(){
			return glProgramState;
		},

		_copy(_glProgram, _glProgramState){
			glProgram = _glProgram;
			glProgramState = _glProgramState;
		},
		clone : clone,
	}
	return self;
}
