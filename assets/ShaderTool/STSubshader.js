
import STPass from "./STPass";

export default function STSubshader(){
	let self = null;
	let passes = [];
	let name = null;

	function init(data){
		name = data.name;
		for(let i in data.passes){
			let passData = data.passes[i];
			let pass = STPass();
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

	function _copy(_name, _passes){
		name = _name;
		for(let k in _passes){
			passes.push(_passes[k].clone());
		}
	}

	function clone(){
		let ret = STSubshader();
		ret._copy(name, passes);
		return ret;
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

		_copy : _copy,
		clone : clone,
	}
	return self;
}
