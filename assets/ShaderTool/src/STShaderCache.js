import STShader from "./STShader";

let shaderMap = {};

function loadShader(path){
	let shader = new STShader();
	shaderMap[path] = shader;

	if(!shader.init(path)){
		cc.error("Failed create shader", path);
	}
	return shader;
}

let STShaderCache = {

	getOrCreate(path){
		let shader = shaderMap[path];
		if(shader){
			return shader;
		}

		return loadShader(path);
	},

	get(path){
		return shaderMap[path];
	},

	reload : loadShader,

	clear(){
		shaderMap = {};
	},
}

export default STShaderCache;
