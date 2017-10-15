import STShader from "./STShader";

let shaderMap = {};

function loadShader(path, glContext){
	let shader = new STShader(glContext);
	shaderMap[path] = shader;

	if(!shader.init(path)){
		cc.error("Failed create shader", path);
	}
	return shader;
}

let STShaderCache = {

	getOrCreate(path, glContext){
		let shader = shaderMap[path];
		if(shader){
			return shader;
		}

		return loadShader(path, glContext);
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
