import STProgram from "./STProgram";

export default function STPass(){
	let self = null;
	let name = null;
	let programs = {};
	let varMap = {};
	let activeProgram = null;


	function vars2id(vars){
		let id = 0;
		for(let k in vars){
			let i = varMap[vars[k]];
			if(i !== undefined){
				id = id | (1 << i);
			}
		}
		return id;
	}

	function init(data){
		name = data.name || "";

		let variants = data.variants;
		for(let i = 0; i < variants.length; ++i){
			let name = variants[i];
			varMap[name] = i;
		}

		let defines = data.defines;
		for(let id in defines){
			let vars = defines[id];
			let program = STProgram(id, vars);
			if(!program.init(data)){
				return false;
			}
			programs[id] = program;
		}

		activeProgram = programs[0];
		return true;
	}

	function matchProgram(variants){
		let id = 0;
		if(variants){
			id = vars2id(variants);
		}
		return programs[id];
	}

	function matchGLProgram(variants){
		let program = matchProgram(variants);
		if(program){
			return program.getGLProgram();
		}
		return null;
	}

	function activateProgram(variants){
		activeProgram = matchProgram(variants);
		return activeProgram;
	}

	self = {
		__cname : "STPass",
		init : init,

		matchProgram : matchProgram,
		matchGLProgram : matchGLProgram,
		activateProgram : activateProgram,

		getName(){
			return name;
		},

		getActiveProgram(){
			return activeProgram;
		},
	}
	return self;
}
