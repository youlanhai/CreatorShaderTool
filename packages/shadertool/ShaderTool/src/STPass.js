"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = STPass;

var _STProgram = require("./STProgram");

var _STProgram2 = _interopRequireDefault(_STProgram);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function STPass(glContext) {
	var self = null;
	var name = null;
	var programs = {};
	var varMap = {};
	var activeProgram = null;

	function vars2id(vars) {
		var id = 0;
		for (var k in vars) {
			var i = varMap[vars[k]];
			if (i !== undefined) {
				id = id | 1 << i;
			}
		}
		return id;
	}

	function init(data) {
		name = data.name || "";

		var variants = data.variants;
		for (var i = 0; i < variants.length; ++i) {
			var _name = variants[i];
			varMap[_name] = i;
		}

		var defines = data.defines;
		for (var id in defines) {
			var vars = defines[id];
			var program = (0, _STProgram2.default)(id, vars, glContext);
			if (!program.init(data)) {
				return false;
			}
			programs[id] = program;
		}

		activeProgram = programs[0];
		return true;
	}

	function matchProgram(variants) {
		var id = 0;
		if (variants) {
			id = vars2id(variants);
		}
		return programs[id];
	}

	function matchGLProgram(variants) {
		var program = matchProgram(variants);
		if (program) {
			return program.getGLProgram();
		}
		return null;
	}

	function activateProgram(variants) {
		activeProgram = matchProgram(variants);
		return activeProgram;
	}

	self = {
		__cname: "STPass",
		init: init,

		matchProgram: matchProgram,
		matchGLProgram: matchGLProgram,
		activateProgram: activateProgram,

		getName: function getName() {
			return name;
		},
		getActiveProgram: function getActiveProgram() {
			return activeProgram;
		}
	};
	return self;
}