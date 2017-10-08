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
		if(!v){
			return;
		}

		let path = cc.url.raw(v);
		let texture = cc.textureCache.addImage(path);

		if(texture){
			glProgram.setUniformTexture(name, texture);
		}
		else{
			cc.error("Failed find material texture", path);
		}
	},
}

UniformSetters.color = UniformSetters.vec4;

export function setProgram (node, program) {
	node.setGLProgramState(program);

	var children = node.children;
	if (!children)
		return;

	for (var i = 0; i < children.length; i++){
		setProgram(children[i], program);
	}
}


export default class STMaterial{
	constructor(){
		this.filePath = null;
		this.shader = null;
		this.variants = null;
		this.values = null;

		this.activeSubshader = null;
		this.activeProgram = null;
		this.activeGLProgramState = null;

		this.glProgramStateCache = {};
	}

	clone(){
		let ret = new STMaterial();
		ret.filePath = this.filePath;
		ret.shader = this.shader;

		ret.values = {};
		for(let k in this.values){
			ret.values[k] = this.values[k];
		}

		ret.setVariants(this.variants);
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
		this.values = data.values;

		this.setVariants(null);
		return true;
	}

	ifValiad(){
		return this.shader && this.shader.ifValiad();
	}

	setVariants(variants){
		this.variants = variants;

		if(this.shader && this.shader.valid){
			this.activeSubshader.activateProgram(variants);

			// cocos2d-x目前不支持多pass，取第一个
			this.activeProgram = this.activeSubshader.getFirstPass().getActiveProgram();
			this.activeGLProgramState = this.createGLProgramState(this.activeProgram.getGLProgram());
		}
	}

	updateUniforms(){
		if(!this.activeGLProgramState){
			return;
		}

		let properties = this.shader.properties;
		let glProgram = this.activeGLProgramState;
		let values = this.values;

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

	setValue(key, value){
		if(!this.activeGLProgramState){
			return;
		}
		let typeInfo = this.shader.properties[key];
		if(!typeInfo){
			return;
		}

		let method = UniformSetters[typeInfo.type];
		if(!method){
			return;
		}

		method(this.activeGLProgramState, key, value);
	}

	getActiveGLProgramState(){
		return this.activeGLProgramState;
	}

	createGLProgramState(glProgram){
		let glProgramState = this.glProgramStateCache[glProgram];
		if(glProgramState === undefined){
			glProgramState = cc.GLProgramState.create(glProgram);
			this.glProgramStateCache[glProgram] = glProgramState;
		}
		return glProgramState;
	}

	applyToNode(node){
		let glProgramState = this.activeGLProgramState;
		if(!glProgramState){
			return;
		}

		this.updateUniforms();
		setProgram(node._sgNode, glProgramState);
	}

}
