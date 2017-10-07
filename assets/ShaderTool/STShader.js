import STSubshader from "./STSubshader";
import {loadJsonFile} from "./STUtils";
import STShaderParser from "./STShaderParser";

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

		let data = null;
		if(filePath.length >= 7 && filePath.substr(-7) === ".shader"){
			let parser = STShaderParser();
			if(!parser.parseFile(filePath)){
				return false;
			}
			data = parser.getResult();
		}
		else{
			data = loadJsonFile(filePath);
		}

		if(!data){
			return false;
		}

		return this.initWithData(data);
	}

	initWithData(data){
		this.name = data.name;
		this.properties = data.properties || {};

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
