import STProgram from "./STProgram";

export default function STPass(){
	let self = null;
	let name = null;
	let programs = {};
	let varList = [];
	let varMap = {};
	let activeProgram = null;

	function id2vars(id){
		let ret = [];
		for(let i = 0; i < varList.length; ++i){
			if(id & (1 << i)){
				ret.push(varList[i]);
			}
		}
		return ret;
	}

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

	// 排列组合
	function arrangePrograms(id, depth){
		if(depth == varList.length){
			programs[id] = STProgram(id, id2vars(id));
		}
		else{
			arrangePrograms(id, depth + 1);
			id = id | (1 << depth);
			arrangePrograms(id, depth + 1);
		}
	}

	function init(data){
		name = data.name || "";

		let variants = data.variants;

		// 将宏去重，并分配编号
		for(let k in variants){
			let name = variants[k];
			if(varMap[name] === undefined){
				varMap[name] = varList.length;
				varList.push(name);
			}
		}

		// 将宏排列组合，生成不同的program
		arrangePrograms(0, 0);

		for(let key in programs){
			let program = programs[key];
			if(!program.init(data)){
				return false;
			}
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
