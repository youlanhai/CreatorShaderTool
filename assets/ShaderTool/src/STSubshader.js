
import STPass from "./STPass";

export default function STSubshader(glContext){
	let self = null;
	let passes = [];
	let name = null;

	function init(data){
		name = data.name;
		for(let i in data.passes){
			let passData = data.passes[i];
			let pass = STPass(glContext);
			if(!pass.init(passData)){
				return false;
			}
			passes.push(pass);
		}
		return true;
	}

	function ifMatch(flags){
		return true;
	}

	function activateProgram(variants){
		for(let k in passes){
			passes[k].activateProgram(variants);
		}
	}

	self = {
		__cname : "STSubshader",
		init : init,
		ifMatch : ifMatch,

		passes : passes,

		activateProgram : activateProgram,

		getName(){
			return name;
		},

		getFirstPass(){
			return passes[0];
		},
	}
	return self;
}
