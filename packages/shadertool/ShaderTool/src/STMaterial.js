"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.setProgram = setProgram;

var _STShaderCache = require("./STShaderCache");

var _STShaderCache2 = _interopRequireDefault(_STShaderCache);

var _STUtils = require("./STUtils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GLProgramState = null;

if (CC_EDITOR) {
	GLProgramState = require("../../CCGLProgramState");
} else {
	GLProgramState = cc.GLProgramState;
}

var TEXTURE_CACHE = {};
function loadTextureInEditorMode(gl, path) {
	path = cc.url.raw(path);
	var tex = TEXTURE_CACHE[path];
	if (tex) {
		return tex;
	}

	Editor.log("loadTextureInEditorMode", gl, path);

	tex = gl.createTexture();
	TEXTURE_CACHE[path] = tex;

	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));

	var image = new Image();
	image.src = path;
	image.onload = function () {
		Editor.log("texture loaded", path);
		gl.bindTexture(gl.TEXTURE0, tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	};
	return tex;
}

var UNIFORM_SETTERS = {
	int: function int(gl, glProgram, name, v) {
		glProgram.setUniformInt(name, v);
	},
	float: function float(gl, glProgram, name, v) {
		glProgram.setUniformFloat(name, v);
	},
	vec2: function vec2(gl, glProgram, name, v) {
		glProgram.setUniformVec2(name, { x: v[0], y: v[1] });
	},
	vec3: function vec3(gl, glProgram, name, v) {
		glProgram.setUniformVec3(name, { x: v[0], y: v[1], z: v[2] });
	},
	vec4: function vec4(gl, glProgram, name, v) {
		glProgram.setUniformVec4(name, { x: v[0], y: v[1], z: v[2], w: v[3] });
	},
	color: function color(gl, glProgram, name, v) {
		var r = v[0] / 255;
		var g = v[1] / 255;
		var b = v[2] / 255;
		var a = v[3] / 255;
		glProgram.setUniformVec4(name, { x: r, y: g, z: b, w: a });
	},
	mat4: function mat4(gl, glProgram, name, v) {
		glProgram.setUniformMat4(name, v);
	},
	texture: function texture(gl, glProgram, name, v) {
		if (!v) {
			return;
		}

		if (CC_EDITOR) {
			var tex = loadTextureInEditorMode(gl, v);
			glProgram.setUniformTexture(name, tex);
		} else {
			var path = cc.url.raw(v);
			var _tex = cc.textureCache.addImage(path);
			if (_tex) {
				glProgram.setUniformTexture(name, _tex);
			} else {
				cc.error("Failed find material texture", path);
			}
		}
	}
};

function setProgram(node, program) {
	node.setGLProgramState(program);

	var children = node.children;
	if (!children) return;

	for (var i = 0; i < children.length; i++) {
		setProgram(children[i], program);
	}
}

var STMaterial = function () {
	function STMaterial(glContext) {
		_classCallCheck(this, STMaterial);

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

	_createClass(STMaterial, [{
		key: "clone",
		value: function clone() {
			var ret = new STMaterial();
			ret.filePath = this.filePath;
			ret.shader = this.shader;

			ret.values = {};
			for (var k in this.values) {
				ret.values[k] = this.values[k];
			}

			ret.setVariants(this.variants);
			return ret;
		}
	}, {
		key: "init",
		value: function init(filePath) {
			this.filePath = filePath;
			var data = (0, _STUtils.loadJsonFile)(filePath);
			if (!data) {
				return false;
			}

			this.values = data.values || {};
			this.variants = data.variants || [];

			this.loadShader(data.shaderPath);
			return true;
		}
	}, {
		key: "loadShader",
		value: function loadShader(shaderPath) {
			this.shaderPath = shaderPath;
			if (CC_EDITOR) {
				this.shader = _STShaderCache2.default.reload(shaderPath, this.glContext);
			} else {
				this.shader = _STShaderCache2.default.getOrCreate(shaderPath, this.glContext);
			}

			this.properties = this.shader.properties;
			this.activeSubshader = this.shader.matchSubshader();

			this.setVariants(this.variants);
		}
	}, {
		key: "save",
		value: function save(filePath) {
			if (!filePath) {
				filePath = this.filePath;
			}

			var data = {
				shaderPath: this.shaderPath,
				values: this.values,
				variants: this.variants
			};
			return (0, _STUtils.saveJsonFile)(filePath, data);
		}
	}, {
		key: "ifValiad",
		value: function ifValiad() {
			return this.shader && this.shader.ifValiad();
		}
	}, {
		key: "setVariants",
		value: function setVariants(variants) {
			this.variants = variants;

			if (this.shader && this.shader.valid) {
				this.activeSubshader.activateProgram(variants);

				// cocos2d-x目前不支持多pass，取第一个
				this.activeProgram = this.activeSubshader.getFirstPass().getActiveProgram();
				this.activeGLProgramState = this.createGLProgramState(this.activeProgram.getGLProgram());
			}
		}
	}, {
		key: "updateUniforms",
		value: function updateUniforms() {
			if (!this.activeGLProgramState) {
				return;
			}

			var properties = this.shader.properties;
			var glProgram = this.activeGLProgramState;
			var values = this.values;

			for (var name in properties) {
				var typeInfo = properties[name];
				var type = typeInfo.type;
				var value = values[name] || typeInfo.default;

				var method = UNIFORM_SETTERS[type];
				if (!method) {
					cc.error("unsupported uniform type", type, name);
				} else {
					method(this.glContext, glProgram, name, value);
				}
			}
		}
	}, {
		key: "setValue",
		value: function setValue(key, value) {
			this.values[key] = value;

			if (!this.activeGLProgramState) {
				return;
			}
			var typeInfo = this.shader.properties[key];
			if (!typeInfo) {
				return;
			}

			var method = UNIFORM_SETTERS[typeInfo.type];
			if (!method) {
				return;
			}

			method(this.glContext, this.activeGLProgramState, key, value);
		}
	}, {
		key: "getActiveGLProgramState",
		value: function getActiveGLProgramState() {
			return this.activeGLProgramState;
		}
	}, {
		key: "createGLProgramState",
		value: function createGLProgramState(glProgram) {
			var glProgramState = this.glProgramStateCache[glProgram];
			if (glProgramState === undefined) {
				glProgramState = GLProgramState.create(glProgram);
				this.glProgramStateCache[glProgram] = glProgramState;
			}
			return glProgramState;
		}
	}, {
		key: "applyToNode",
		value: function applyToNode(node) {
			var glProgramState = this.activeGLProgramState;
			if (!glProgramState) {
				return;
			}

			this.updateUniforms();
			setProgram(node._sgNode, glProgramState);
		}
	}, {
		key: "use",
		value: function use() {
			var glProgramState = this.activeGLProgramState;
			if (!glProgramState) {
				return;
			}

			this.updateUniforms();
			glProgramState.use();
		}
	}]);

	return STMaterial;
}();

exports.default = STMaterial;