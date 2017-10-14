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

var UniformSetters = {
	int: function int(glProgram, name, v) {
		glProgram.setUniformInt(name, v);
	},
	float: function float(glProgram, name, v) {
		glProgram.setUniformFloat(name, v);
	},
	vec2: function vec2(glProgram, name, v) {
		glProgram.setUniformVec2(name, { x: v[0], y: v[1] });
	},
	vec3: function vec3(glProgram, name, v) {
		glProgram.setUniformVec2(name, { x: v[0], y: v[1], z: v[2] });
	},
	vec4: function vec4(glProgram, name, v) {
		glProgram.setUniformVec4(name, { x: v[0], y: v[1], z: v[2], w: v[3] });
	},
	mat4: function mat4(glProgram, name, v) {
		glProgram.setUniformMat4(name, v);
	},
	texture: function texture(glProgram, name, v) {
		if (!v) {
			return;
		}

		var path = cc.url.raw(v);
		var texture = cc.textureCache.addImage(path);

		if (texture) {
			glProgram.setUniformTexture(name, texture);
		} else {
			cc.error("Failed find material texture", path);
		}
	}
};

UniformSetters.color = UniformSetters.vec4;

function setProgram(node, program) {
	node.setGLProgramState(program);

	var children = node.children;
	if (!children) return;

	for (var i = 0; i < children.length; i++) {
		setProgram(children[i], program);
	}
}

var STMaterial = function () {
	function STMaterial() {
		_classCallCheck(this, STMaterial);

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

			this.shaderPath = data.shaderPath;
			if (CC_EDITOR) {
				this.shader = _STShaderCache2.default.reload(this.shaderPath);
			} else {
				this.shader = _STShaderCache2.default.getOrCreate(this.shaderPath);
			}
			this.activeSubshader = this.shader.matchSubshader();
			this.values = data.values || {};
			this.properties = this.shader.properties;

			this.setVariants(data.variants || []);
			return true;
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

				var method = UniformSetters[type];
				if (method === undefined) {
					cc.error("unsupported uniform type", type, name);
				} else {
					method(glProgram, name, value);
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

			var method = UniformSetters[typeInfo.type];
			if (!method) {
				return;
			}

			method(this.activeGLProgramState, key, value);
		}
	}, {
		key: "getActiveGLProgramState",
		value: function getActiveGLProgramState() {
			return this.activeGLProgramState;
		}
	}, {
		key: "createGLProgramState",
		value: function createGLProgramState(glProgram) {
			if (CC_EDITOR) {
				return null;
			}
			var glProgramState = this.glProgramStateCache[glProgram];
			if (glProgramState === undefined) {
				glProgramState = cc.GLProgramState.create(glProgram);
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
	}]);

	return STMaterial;
}();

exports.default = STMaterial;