import STSubshader from "./STSubshader";
import {loadJsonFile} from "./STUtils";

export default class STShader{
	constructor(){
		this.filePath = null;
		this.name = null;
		this.properties = null;
		this.subshaders = [];
		this.fallbackShader = null;
		this.valid = false;
	}

	init(filePath){
		this.filePath = filePath;

		let data = loadJsonFile(filePath);
		if(!data){
			return false;
		}

		this.name = data.name;
		this.properties = data.properties;

		let subshadersData = data.subshaders;
		for(let key in subshadersData){
			let subshaderData = subshadersData[key];
			let subshader = STSubshader();
			if(!subshader.init(subshaderData)){
				return false;
			}

			this.subshaders.push(subshader);
		}

		let fallback = data.fallback;
		if(fallback){
			// this.fallbackShader = findFallbackShader(fallback);
		}

		this.valid = true;
		return true;
	}

	ifValiad(){
		return this.valid;
	}

	matchSubshader(flags){
		let ret = null;
		for(let key in this.subshaders){
			let subshader = this.subshaders[key];
			if(subshader.ifMatch(flags)){
				return subshader;
			}
		}
		return this.fallbackShader;
	}
}
