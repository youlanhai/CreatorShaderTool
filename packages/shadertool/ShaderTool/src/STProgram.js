"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = STProgram;

var GLProgram = null;
if (CC_EDITOR) {
	GLProgram = require("../../CCGLProgram");
} else {
	GLProgram = cc.GLProgram;
}

function STProgram(id, variants, glContext) {
	var self = null;
	var glProgram = null;

	function createGLProgram(vsh, fsh) {
		if (CC_EDITOR) {
			cc.assert(glContext !== null, "setGLContext first");
		}

		glProgram = new GLProgram(null, null, glContext);
		if (!glProgram.initWithString(vsh, fsh)) {
			cc.error("Failed create GLProgram:", id, variants);
			return false;
		}

		glProgram.link();
		glProgram.use();
		glProgram.updateUniforms();
		return true;
	}

	function init(data) {
		var strs = [];
		for (var key in variants) {
			strs.push("#define " + variants[key]);
		}
		strs.push("\n");

		var defines = strs.join("\n");
		var vsh = defines + data.vsh;
		var fsh = defines + data.fsh;

		return createGLProgram(vsh, fsh);
	}

	self = {
		__cname: "STProgram",
		init: init,

		getID: function getID() {
			return id;
		},
		getGLProgram: function getGLProgram() {
			return glProgram;
		}
	};
	return self;
}