
export default function STProgram(id, variants){
	let self = null;
	let glProgram = null;

	function createGLProgram(vsh, fsh){
		glProgram = new cc.GLProgram();
		if(!glProgram.initWithString(vsh, fsh)){
			cc.error("Failed create GLProgram:", id, variants);
			return false;
		}

		glProgram.link();
		glProgram.updateUniforms();
		glProgram.use();
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

		if(CC_EDITOR){
			return true;
		}
		else{
			return createGLProgram(vsh, fsh);
		}
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
