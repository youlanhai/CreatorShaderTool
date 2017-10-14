"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _STMaterial = require("./STMaterial");

var _STMaterial2 = _interopRequireDefault(_STMaterial);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var materialMap = {};

function loadMaterial(path) {
	var material = new _STMaterial2.default();
	materialMap[path] = material;

	if (!material.init(path)) {
		cc.error("Failed create material", path);
	}
	return material;
}

var STMaterialCache = {
	getOrCreate: function getOrCreate(path) {
		var material = materialMap[path];
		if (material) {
			return material;
		}

		return loadMaterial(path);
	},
	get: function get(path) {
		return materialMap[path];
	},


	reload: loadMaterial,

	clear: function clear() {
		materialMap = {};
	}
};

exports.default = STMaterialCache;