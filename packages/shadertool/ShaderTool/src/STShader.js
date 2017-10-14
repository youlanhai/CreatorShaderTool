"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _STSubshader = require("./STSubshader");

var _STSubshader2 = _interopRequireDefault(_STSubshader);

var _STUtils = require("./STUtils");

var _STShaderParser = require("./STShaderParser");

var _STShaderParser2 = _interopRequireDefault(_STShaderParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var STShader = function () {
	function STShader() {
		_classCallCheck(this, STShader);

		this.filePath = null;
		this.name = null;
		this.properties = null;
		this.subshaders = [];
		this.fallbackShader = null;
		this.valid = false;
	}

	_createClass(STShader, [{
		key: "init",
		value: function init(filePath) {
			this.filePath = filePath;

			var data = null;
			if (filePath.length >= 7 && filePath.substr(-7) === ".shader") {
				var parser = (0, _STShaderParser2.default)();
				if (!parser.parseFile(filePath)) {
					return false;
				}
				data = parser.getResult();
			} else {
				data = (0, _STUtils.loadJsonFile)(filePath);
			}

			if (!data) {
				return false;
			}

			return this.initWithData(data);
		}
	}, {
		key: "initWithData",
		value: function initWithData(data) {
			this.name = data.name;
			this.properties = data.properties || {};

			var subshadersData = data.subshaders;
			for (var key in subshadersData) {
				var subshaderData = subshadersData[key];
				var subshader = (0, _STSubshader2.default)();
				if (!subshader.init(subshaderData)) {
					return false;
				}

				this.subshaders.push(subshader);
			}

			var fallback = data.fallback;
			if (fallback) {
				// this.fallbackShader = findFallbackShader(fallback);
			}

			this.valid = true;
			return true;
		}
	}, {
		key: "ifValiad",
		value: function ifValiad() {
			return this.valid;
		}
	}, {
		key: "matchSubshader",
		value: function matchSubshader(flags) {
			var ret = null;
			for (var key in this.subshaders) {
				var subshader = this.subshaders[key];
				if (subshader.ifMatch(flags)) {
					return subshader;
				}
			}
			return this.fallbackShader;
		}
	}]);

	return STShader;
}();

exports.default = STShader;