import STShaderCache from "./STShaderCache";
import {loadJsonFile} from "./STUtils";

let UniformSetters = {
	int(glProgram, name, v){
		glProgram.setUniformInt(name, v);
	},

	float(glProgram, name, v){
		glProgram.setUniformFloat(name, v);
	},

	vec2(glProgram, name, v){
		glProgram.setUniformVec2(name, {x: v[0], y: v[1]});
	},

	vec3(glProgram, name, v){
		glProgram.setUniformVec2(name, {x: v[0], y: v[1], z: v[2]});
	},

	vec4(glProgram, name, v){
		glProgram.setUniformVec2(name, {x: v[0], y: v[1], z: v[2], w: v[3]});
	},

	mat4(glProgram, name, v){
		glProgram.setUniformMat4(name, v);
	},

	texture(glProgram, name, v){
		let texture = null;
		if(v){
			let url = cc.url.raw(v);
			texture = cc.textureCache.addImage(url);
		}
		glProgram.setUniformTexture(name, texture);
	},
}

UniformSetters.color = UniformSetters.vec4;

export default class STMaterial{
	constructor(){
		this.filePath = null;
		this.shader = null;
		this.variants = null;
		this.properties = null;

		this.activeSubshader = null;
		this.activeProgram = null;
	}

	clone(){
		let ret = new STMaterial();
		ret.filePath = this.filePath;

		if(this.shader){
			ret.shader = this.shader.clone();

			ret.properties = {};
			for(let k in this.properties){
				ret.properties[k] = this.properties[k];
			}

			ret.activeSubshader = ret.shader.matchSubshader();

			ret.setVariants(this.variants);
		}
		return ret;
	}

	init(filePath){
		this.filePath = filePath;
		let data = loadJsonFile(filePath);
		if(!data){
			return false;
		}

		this.shader = STShaderCache.getOrCreate(data.shaderPath);
		this.activeSubshader = this.shader.matchSubshader();
		this.properties = data.properties;

		this.setVariants(null);
		return true;
	}

	ifValiad(){
		return this.shader && this.shader.ifValiad();
	}

	clone(){
		return null;
	}

	setVariants(variants){
		this.variants = variants;

		if(this.shader && this.shader.valid){
			this.activeSubshader.activateProgram(variants);

			// cocos2d-x目前不支持多pass，取第一个
			this.activeProgram = this.activeSubshader.getFirstPass().getActiveProgram();
		}
	}

	updateUniforms(){
		if(!this.activeProgram){
			return;
		}

		let properties = this.shader.properties;
		let glProgram = this.activeProgram.getGLProgramState();
		let values = this.properties;

		for(let name in properties){
			let typeInfo = properties[name];
			let type = typeInfo.type;
			let value = values[name] || typeInfo.default;

			let method = UniformSetters[type];
			if(method === undefined){
				cc.error("unsupported uniform type", type, name);
			}
			else{
				method(glProgram, name, value);
			}
		}
	}

	getActiveGLProgramState(){
		if(this.activeProgram){
			return this.activeProgram.getGLProgramState();
		}
		return null;
	}
}
