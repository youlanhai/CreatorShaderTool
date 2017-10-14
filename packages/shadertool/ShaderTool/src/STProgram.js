"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = STProgram;
function STProgram(id, variants) {
	var self = null;
	var glProgram = null;

	function createGLProgram(vsh, fsh) {
		glProgram = new cc.GLProgram();
		if (!glProgram.initWithString(vsh, fsh)) {
			cc.error("Failed create GLProgram:", id, variants);
			return false;
		}

		glProgram.link();
		glProgram.updateUniforms();
		glProgram.use();
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

		if (CC_EDITOR) {
			return true;
		} else {
			return createGLProgram(vsh, fsh);
		}
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