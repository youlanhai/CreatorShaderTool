"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = STSubshader;

var _STPass = require("./STPass");

var _STPass2 = _interopRequireDefault(_STPass);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function STSubshader(glContext) {
	var self = null;
	var passes = [];
	var name = null;

	function init(data) {
		name = data.name;
		for (var i in data.passes) {
			var passData = data.passes[i];
			var pass = (0, _STPass2.default)(glContext);
			if (!pass.init(passData)) {
				return false;
			}
			passes.push(pass);
		}
		return true;
	}

	function ifMatch(flags) {
		return true;
	}

	function activateProgram(variants) {
		for (var k in passes) {
			passes[k].activateProgram(variants);
		}
	}

	self = {
		__cname: "STSubshader",
		init: init,
		ifMatch: ifMatch,

		passes: passes,

		activateProgram: activateProgram,

		getName: function getName() {
			return name;
		},
		getFirstPass: function getFirstPass() {
			return passes[0];
		}
	};
	return self;
}