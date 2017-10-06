import STMaterial from "./STMaterial";

let materialMap = {};

function loadMaterial(path){
	let material = new STMaterial();
	materialMap[path] = material;

	if(!material.init(path)){
		cc.error("Failed create material", path);
	}
	return material;
}

let STMaterialCache = {

	getOrCreate(path){
		let material = materialMap[path];
		if(material){
			return material;
		}

		return loadMaterial(path);
	},

	get(path){
		return materialMap[path];
	},

	reload : loadMaterial,

	clear(){
		materialMap = {};
	},
}

export default STMaterialCache;
