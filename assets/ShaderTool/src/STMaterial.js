import STShaderCache from "./STShaderCache";
import {loadJsonFile, saveJsonFile} from "./STUtils";

let GLProgramState = null;

if(CC_EDITOR){
	GLProgramState = require("../../CCGLProgramState");
}
else{
	GLProgramState = cc.GLProgramState;
}

let TEXTURE_CACHE = {};
function loadTextureInEditorMode(gl, path){
	path = cc.url.raw(path);
	let tex = TEXTURE_CACHE[path];
	if(tex){
		return tex;
	}
	
	Editor.log("loadTextureInEditorMode", gl, path);

	tex = gl.createTexture();
	TEXTURE_CACHE[path] = tex;

	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
		new Uint8Array([255, 0, 0, 255])); 

	let image = new Image();
	image.src = path;
	image.onload = function(){
		Editor.log("texture loaded", path);
		gl.bindTexture(gl.TEXTURE0, tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	}
	return tex;
}

let UNIFORM_SETTERS = {
	int(gl, glProgram, name, v){
		glProgram.setUniformInt(name, v);
	},

	float(gl, glProgram, name, v){
		glProgram.setUniformFloat(name, v);
	},

	vec2(gl, glProgram, name, v){
		glProgram.setUniformVec2(name, {x: v[0], y: v[1]});
	},

	vec3(gl, glProgram, name, v){
		glProgram.setUniformVec3(name, {x: v[0], y: v[1], z: v[2]});
	},

	vec4(gl, glProgram, name, v){
		glProgram.setUniformVec4(name, {x: v[0], y: v[1], z: v[2], w: v[3]});
	},

	color(gl, glProgram, name, v){
		let r = v[0] / 255;
		let g = v[1] / 255;
		let b = v[2] / 255;
		let a = v[3] / 255;
		glProgram.setUniformVec4(name, {x: r, y: g, z: b, w: a});
	},

	mat4(gl, glProgram, name, v){
		glProgram.setUniformMat4(name, v);
	},

	texture(gl, glProgram, name, v){
		if(!v){
			return;
		}

		if(CC_EDITOR){
			let tex = loadTextureInEditorMode(gl, v);
			glProgram.setUniformTexture(name, tex);
		}
		else{
			let path = cc.url.raw(v);
			let tex = cc.textureCache.addImage(path);
			if(tex){
				glProgram.setUniformTexture(name, tex);
			}
			else{
				cc.error("Failed find material texture", path);
			}
		}
	},
}


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
	constructor(glContext){
		this.glContext = glContext;
		this.filePath = null;
		this.shader = null;
		this.shaderPath = null;
		this.variants = [];
		this.values = {};
		this.properties = {};

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

		this.values = data.values || {};
		this.variants = data.variants || [];

		this.loadShader(data.shaderPath);
		return true;
	}

	loadShader(shaderPath){
		this.shaderPath = shaderPath;
		if(CC_EDITOR){
			this.shader = STShaderCache.reload(shaderPath, this.glContext);
		}
		else{
			this.shader = STShaderCache.getOrCreate(shaderPath, this.glContext);
		}

		this.properties = this.shader.properties;
		this.activeSubshader = this.shader.matchSubshader();

		this.setVariants(this.variants);
	}

	save(filePath){
		if(!filePath){
			filePath = this.filePath;
		}

		let data = {
			shaderPath : this.shaderPath,
			values : this.values,
			variants : this.variants,
		}
		return saveJsonFile(filePath, data);
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

			let method = UNIFORM_SETTERS[type];
			if(!method){
				cc.error("unsupported uniform type", type, name);
			}
			else{
				method(this.glContext, glProgram, name, value);
			}
		}
	}

	setValue(key, value){
		this.values[key] = value;

		if(!this.activeGLProgramState){
			return;
		}
		let typeInfo = this.shader.properties[key];
		if(!typeInfo){
			return;
		}

		let method = UNIFORM_SETTERS[typeInfo.type];
		if(!method){
			return;
		}

		method(this.glContext, this.activeGLProgramState, key, value);
	}

	getActiveGLProgramState(){
		return this.activeGLProgramState;
	}

	createGLProgramState(glProgram){
		let glProgramState = this.glProgramStateCache[glProgram];
		if(glProgramState === undefined){
			glProgramState = GLProgramState.create(glProgram);
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

	use(){
		let glProgramState = this.activeGLProgramState;
		if(!glProgramState){
			return;
		}

		this.updateUniforms();
		glProgramState.use();
	}
}
