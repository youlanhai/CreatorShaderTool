"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _STShader = require("./STShader");

var _STShader2 = _interopRequireDefault(_STShader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var shaderMap = {};

function loadShader(path, glContext) {
	var shader = new _STShader2.default(glContext);
	shaderMap[path] = shader;

	if (!shader.init(path)) {
		cc.error("Failed create shader", path);
	}
	return shader;
}

var STShaderCache = {
	getOrCreate: function getOrCreate(path, glContext) {
		var shader = shaderMap[path];
		if (shader) {
			return shader;
		}

		return loadShader(path, glContext);
	},
	get: function get(path) {
		return shaderMap[path];
	},


	reload: loadShader,

	clear: function clear() {
		shaderMap = {};
	}
};

exports.default = STShaderCache;