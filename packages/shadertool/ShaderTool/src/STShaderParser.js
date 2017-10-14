"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Lexer = Lexer;
exports.default = STShaderParser;

var _STUtils = require("./STUtils");

var STUtils = _interopRequireWildcard(_STUtils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var TK_NULL = null;
var TK_IDENTITY = "identity";
var TK_STRING = "string";
var TK_NUMBER = "number";

var BLANK_CHARS = "\t \r\n\b\f";
var NUMBER_CHARS = "0123456789";
var ALPHABET_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
var IDENTITY_CHARS = ALPHABET_CHARS + NUMBER_CHARS + "_";
var format = cc.js.formatStr;

function translateChar(ch) {
	switch (ch) {
		case 'n':
			return '\n';
		case 'r':
			return '\r';
		case 'f':
			return '\f';
		case 'b':
			return '\b';
		case 't':
			return '\t';
		case '0':
			return '\0';
		default:
			return ch;
	}
}

// Shader词法分析器
function Lexer(content) {
	var index = 0;
	var value = null;
	var line = 1;
	var column = 1;

	function error(msg) {
		throw msg + " at line " + line + ":" + column;
	}

	function getch() {
		if (index >= content.length) {
			return 0;
		}

		var ch = content[index];
		++index;
		++column;
		if (ch === '\n') {
			++line;
			column = 1;
		}
		return ch;
	}

	function lookAhead() {
		if (index >= content.length) {
			return 0;
		}
		return content[index];
	}

	function readString(endCh, newLineCh) {
		var ret = [];
		var _line = line;
		var _column = column;

		while (true) {
			var ch = getch();
			if (ch === 0) {
				break;
			} else if (ch === endCh) {
				return ret.join("");
			} else if (ch === newLineCh) {
				break;
			} else if (ch === '\\') {
				ch = getch();
				ch = translateChar(ch);
			}
			ret.push(ch);
		}

		line = _line;
		column = _column;
		error("unclosed string");
	}

	function readLineComment() {
		while (true) {
			var ch = getch();
			if (ch === 0 || ch == '\n') {
				return;
			}
		}
	}

	function readLongComment() {
		var _line = line;
		var _column = column;
		var depth = 1;

		while (true) {
			var ch = getch();
			if (ch === 0) {
				break;
			} else if (ch === '*') {
				ch = getch();
				if (ch === '/') {
					--depth;
					if (depth === 0) {
						return;
					}
				}
			} else if (ch === '/') {
				ch = getch();
				if (ch === '*') {
					++depth;
				}
			}
		}

		line = _line;
		column = _column;
		error("unclosed comment");
	}

	function readNumber(ch) {
		var cache = [ch];
		var isFloat = false;

		function _readInt() {
			while (ch !== 0) {
				ch = lookAhead();
				if (NUMBER_CHARS.indexOf(ch) < 0) {
					break;
				}
				cache.push(getch());
			}
		}

		if (ch === '+' || ch === '-') {
			cache.push(getch());
		}

		if (ch === '0') {
			ch = lookAhead();
			if (ch === 'x' || ch === 'X' || ch === 'b' || ch === 'B') {
				cache.push(getch());
			} else if (ch === '.') {
				isFloat = true;
			}
		}

		_readInt();

		if (ch == '.') {
			isFloat = true;
			cache.push(getch());

			_readInt();
		}

		if (ch === 'e' || ch === 'E') {
			cache.push(getch());

			ch = lookAhead();
			if (ch === '+' || ch === '-') {
				cache.push(getch());
			}

			_readInt();
		}

		if (ch === 'l' || ch === 'L' || ch === 'u' || ch === 'U') {
			if (isFloat) {
				error("invalid number");
			}
			getch();
			cache.push(ch);
		}

		var text = cache.join("");
		return parseFloat(text);
	}

	function readIdentity(ch) {
		var cache = [ch];

		while (true) {
			ch = lookAhead();
			if (IDENTITY_CHARS.indexOf(ch) < 0) {
				break;
			}
			cache.push(getch());
		}
		return cache.join("");
	}

	function next() {
		value = null;

		while (true) {
			var ch = getch();
			if (ch === 0) {
				return TK_NULL;
			} else if (BLANK_CHARS.indexOf(ch) >= 0) {
				continue;
			} else if ("{},;()=".indexOf(ch) >= 0) {
				return ch;
			} else if (ch === '"') {
				value = readString('"', '\n');
				return TK_STRING;
			} else if (ch === "'") {
				value = readString("'", '\n');
				return TK_STRING;
			} else if (ch === '`') {
				value = readString('`', 0);
				return TK_STRING;
			} else if (ch === '/') {
				ch = getch();
				if (ch == '/') {
					readLineComment();
					continue;
				} else if (ch == '*') {
					readLongComment();
					continue;
				} else {
					error("invalid symbol '/'");
				}
			} else if (NUMBER_CHARS.indexOf(ch) >= 0) {
				value = readNumber(ch);
				return TK_NUMBER;
			} else if ('+-'.indexOf(ch) >= 0) {
				var nextCh = lookAhead();
				if (NUMBER_CHARS.indexOf(ch) >= 0) {
					value = readNumber(ch);
					return TK_NUMBER;
				}
			} else if (ch === '_' || ALPHABET_CHARS.indexOf(ch) >= 0) {
				value = readIdentity(ch);
				return TK_IDENTITY;
			}

			error("unsupported symbol " + ch);
		}
	}

	function nextToken() {
		return {
			token: next(),
			value: value,
			line: line,
			column: column
		};
	}

	return {
		nextToken: nextToken
	};
}

// Shader语法解析器
function STShaderParser() {
	var lexer = null;

	var result = {
		name: "",
		properties: {},
		subshaders: [],
		fallback: ""
	};

	var token = null;
	var tokenValue = null;
	var tokenInfo = null;
	var lastError = null;

	function next() {
		tokenInfo = lexer.nextToken();

		token = tokenInfo.token;
		tokenValue = tokenInfo.value;
		return token;
	}

	function error(desc, msg) {
		throw format("%s: %s. at line %d : %d", desc, msg, tokenInfo.line, tokenInfo.column);
	}

	function matchToken(desc, tk) {
		if (token !== tk) {
			error(desc, format("token '%s' expected, but '%s' was given", tk, token));
		}
	}

	function matchNext(desc, tk) {
		next();
		return matchToken(desc, tk);
	}

	function parseValue(desc) {
		if (token === TK_NUMBER || token === TK_STRING || token === TK_IDENTITY) {
			return tokenValue;
		} else if (token === '(') {
			var ret = [];

			next();
			while (token !== ')') {
				ret.push(parseValue(desc));

				next();
				if (token === ')') {
					break;
				}
				matchToken(desc, ',');
				next();
			}

			matchToken(desc, ')');
			return ret;
		} else {
			error(desc, format("value expected, but '%s' was given", token));
		}
	}

	/** Properties语法：
  *  Properties {
  *      VarName(Description, Type) = Default;
  *      ...
  *  }
  */
	function parseProperties() {
		var desc = "Properties";
		matchNext(desc, '{');

		next();
		while (token !== '}') {
			var property = {};

			matchToken(desc, TK_IDENTITY);
			var name = tokenValue;

			matchNext(desc, '(');
			matchNext(desc, TK_STRING);
			property.desc = tokenValue;

			matchNext(desc, ',');
			matchNext(desc, TK_IDENTITY);
			property.type = tokenValue;

			matchNext(desc, ')');
			matchNext(desc, '=');

			next();
			property.default = parseValue(desc);
			matchNext(desc, ';');

			result.properties[name] = property;

			next();
		}

		matchToken(desc, '}');
	}

	function processVariants(pass) {
		var variants = pass.variants;
		if (variants == undefined) {
			variants = [];
			pass.variants = variants;
		}

		var varList = [];
		var varMap = {};
		// 将宏去重，并分配编号
		for (var k in variants) {
			var name = variants[k];
			if (varMap[name] === undefined) {
				varMap[name] = varList.length;
				varList.push(name);
			}
		}

		var defines = { 0: [] };
		// 排列组合
		function arrangeVarints(id, depth, vars) {
			if (depth == varList.length) {
				defines[id] = vars.slice(0);
			} else {
				arrangeVarints(id, depth + 1, vars);

				id = id | 1 << depth;
				vars.push(varList[depth]);
				arrangeVarints(id, depth + 1, vars);
				vars.pop();
			}
		}

		function parseValidVariants(pairs) {
			for (var key in pairs) {
				var macros = pairs[key];
				var id = 0;
				for (var mk in macros) {
					var macro = macros[mk];
					var i = varMap[macro];
					if (i == undefined) {
						error("Pass", "undefined macro " + macro);
					}
					id |= 1 << i;
				}
				defines[id] = macros;
			}
		}

		if (pass.valiadPairs) {
			parseValidVariants(pass.valiadPairs);
			delete pass.valiadPairs;
		} else {
			arrangeVarints(0, 0, []);
		}

		pass.variants = varList;
		pass.defines = defines;
	}

	/** Pass语法：
  *  Pass {
  *      key = value;
  *      ...
  *  }
  */
	function parsePass() {
		var desc = "Pass";
		var pass = {};

		matchNext(desc, "{");

		next();
		while (token !== '}') {
			matchToken(desc, TK_IDENTITY);
			var name = tokenValue;

			matchNext(desc, '=');

			next();
			var value = parseValue(desc);
			matchNext(desc, ';');

			pass[name] = value;

			next();
		}

		matchToken(desc, "}");

		processVariants(pass);
		return pass;
	}

	/** SubShader语法：
  *  SubShader {
  *      Pass{}
  *      ...
  *  }
  */
	function parseSubshader() {
		var subshader = {
			name: "",
			passes: []
		};
		var desc = "SubShader";

		matchNext(desc, "{");

		next();
		while (token !== '}') {
			if (token === TK_IDENTITY) {
				if (tokenValue === "Pass") {
					var pass = parsePass();
					subshader.passes.push(pass);
				} else {
					error(desc, "Invalid token " + tokenValue);
				}
			} else {
				error(desc, "Invalid token " + token);
			}

			next();
		}

		matchToken(desc, "}");
		result.subshaders.push(subshader);
	}

	/** Fallback语法:
  *  Fallback "to/shader/path";
  */
	function parseFallback() {
		var desc = "Fallback";
		matchNext(desc, TK_STRING);
		result.fallback = tokenValue;
		matchNext(desc, ";");
	}

	/** Shader语法：
  *  Shader name {
  *      Properties{}
  *      SubShader{}
  *      SubShader{}
  *      Fallback "path";  
  *  }
  */
	function parseShader() {
		var desc = "Shader";

		next();
		if (token !== TK_IDENTITY || tokenValue !== "Shader") {
			error(desc, "keyword 'Shader' expected but " + token + " was given");
		}

		next();
		if (token === TK_STRING) {
			result.name = tokenValue;
			next();
		}
		matchToken(desc, '{');

		next();
		while (token !== '}') {
			if (token === TK_NULL) {
				break;
			}
			if (token === ';') {
				continue;
			}
			if (token === TK_IDENTITY) {
				switch (tokenValue) {
					case "Properties":
						parseProperties();break;
					case "SubShader":
						parseSubshader();break;
					case "Fallback":
						parseFallback();break;
					default:
						error(desc, "Invalid token " + tokenValue);
				}
			} else {
				error(desc, "Invalid token " + token);
			}

			next();
		}

		matchToken(desc, '}');
	}

	function parse(content) {
		lexer = Lexer(content);

		try {
			parseShader();
		} catch (err) {
			lastError = err;
			cc.error("Parse shader failed: ", err);
			return false;
		}
		return true;
	}

	function parseFile(path) {
		var content = STUtils.readFile(path);
		if (!content) {
			cc.error("Failed load file", path);
			return false;
		}
		return parse(content);
	}

	function getResult() {
		return result;
	}

	function saveResult(path) {
		var text = JSON.stringify(result, null, 4);
		STUtils.writeFile(path, text);
		cc.log("save result to", path);
	}

	return {
		__cname: "STShaderParser",
		parse: parse,
		parseFile: parseFile,

		getResult: getResult,
		saveResult: saveResult,

		getLastError: function getLastError() {
			return lastError;
		}
	};
}