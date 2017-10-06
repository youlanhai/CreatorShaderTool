
let TK_NULL = null;
let TK_IDENTITY = 257;
let TK_STRING = 258;
let TK_NUMBER = 259;

let BLANK_CHARS = "\t \r\n\b\f"
let NUMBER_CHARS = "0123456789";
let ALPHABET_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
let IDENTITY_CHARS = ALPHABET_CHARS + NUMBER_CHARS + "_";
let format = cc.js.formatStr;

function translateChar(ch){
	switch(ch){
		case 'n': return '\n';
		case 'r': return '\r';
		case 'f': return '\f';
		case 'b': return '\b';
		case 't': return '\t';
		case '0': return '\0';
		default: return ch;
	}
}

function Lexer(content){
	let index = 0;
	let value = null;
	let line = 1;
	let column = 1;

	function error(msg){
		throw msg + " at line " + line + ":" + column;
	}

	function getch(){
		if(index >= content.length){
			return 0;
		}

		let ch = content[index];
		++index;
		++column;
		if(ch === '\n'){
			++line;
			column = 1;
		}
		return ch;
	}

	function lookAhead(){
		if(index >= content.length){
			return 0;
		}
		return content[index]
	}

	function readString(endCh, newLineCh){
		let ret = [];
		let _line = line;
		let _column = column;

		while(true){
			let ch = getch();
			if(ch === 0){
				break;
			}
			else if(ch === endCh){
				return ret.join("");
			}
			else if(ch === newLineCh){
				break;
			}
			else if(ch === '\\'){
				ch = getch();
				ch = translateChar(ch);
			}
			ret.push(ch);
		}

		line = _line;
		column = _column;
		error("unclosed string");
	}

	function readLineComment(){
		while(true){
			let ch = getch();
			if(ch === 0 || ch == '\n'){
				return;
			}
		}
	}

	function readLongComment(){
		let _line = line;
		let _column = column;
		let depth = 1;

		while(true){
			let ch = getch();
			if(ch === 0){
				break;
			}
			else if(ch === '*'){
				ch = getch();
				if(ch === '/'){
					--depth;
					if(depth === 0){
						return;
					}
				}
			}
			else if(ch === '/'){
				ch = getch();
				if(ch === '*'){
					++depth;
				}
			}
		}

		line = _line;
		column = _column;
		error("unclosed comment");
	}

	function readNumber(ch){
		let cache = [ch, ];
		let isFloat = false;

		function _readInt(){
			while(ch !== 0){
				ch = lookAhead();
				if(NUMBER_CHARS.indexOf(ch) < 0){
					break;
				}
				cache.push(getch());
			}
		}

		if(ch === '+' || ch === '-'){
			cache.push(getch());
		}

		if(ch === '0'){
			ch = lookAhead();
			if (ch === 'x' || ch === 'X' || ch === 'b' || ch === 'B'){
				cache.push(getch());
			}
			else if(ch === '.'){
				isFloat = true;
			}
		}

		_readInt();

		if(ch == '.'){
			isFloat = true;
			cache.push(getch());

			_readInt();
		}

		if(ch === 'e' || ch === 'E'){
			cache.push(getch());

			ch = lookAhead();
			if(ch === '+' || ch === '-'){
				cache.push(getch());
			}

			_readInt();
		}
		
		if(ch === 'l' || ch === 'L' || ch === 'u' || ch === 'U'){
			if(isFloat){
				error("invalid number");
			}
			getch();
			cache.push(ch);
		}

		let text = cache.join("");
		return parseFloat(text);
	}

	function readIdentity(ch){
		let cache = [ch, ];

		while(true){
			ch = lookAhead();
			if(IDENTITY_CHARS.indexOf(ch) < 0){
				break;
			}
			cache.push(getch());
		}
		return cache.join("");
	}

	function next(){
		value = null;

		while(true){
			let ch = getch();
			if(ch === 0){
				return TK_NULL;
			}
			else if(BLANK_CHARS.indexOf(ch) >= 0){
				continue;
			}
			else if("{},;()=".indexOf(ch) >= 0){
				return ch;
			}
			else if(ch === '"'){
				value = readString('"', '\n');
				return TK_STRING;
			}
			else if(ch === "'"){
				value = readString("'", '\n');
				return TK_STRING;
			}
			else if(ch === '`'){
				value = readString('`', 0);
				return TK_STRING;
			}
			else if(ch === '/'){
				ch = getch();
				if(ch == '/'){
					readLineComment();
					continue;
				}
				else if(ch == '*'){
					readLongComment();
					continue;
				}
				else{
					throw "invalid symbol '/'";
				}
			}
			else if(NUMBER_CHARS.indexOf(ch) >= 0){
				value = readNumber(ch);
				return TK_NUMBER;
			}
			else if('+-'.indexOf(ch) >= 0){
				let nextCh = lookAhead();
				if(NUMBER_CHARS.indexOf(ch) >= 0){
					value = readNumber(ch);
					return TK_NUMBER;
				}
			}
			else if(ch === '_' || ALPHABET_CHARS.indexOf(ch) >= 0){
				value = readIdentity(ch);
				return TK_IDENTITY;
			}

			throw "unsupported symbol " + ch;
		}
	}

	function nextTokenInfo(){
		return {
			token : next(),
			value : value,
			line : line,
			column : column,
		};
	}

	return {
		next : next,

		nextTokenInfo : nextTokenInfo,

		getValue(){
			return value;
		},

		getLine(){
			return line;
		},

		getColumn(){
			return column;
		},
	}
}

export default function STShaderParser(){
	let lexer = null;

	let result = {
		shaderName : "",
		properties : {},
		subshaders : [],
		fallback : "",
	}

	let token = null;
	let tokenValue = null;
	let curTokenInfo = null;
	let nextTokenInfo = null;

	function next(){
		if(nextTokenInfo !== null){
			curTokenInfo = nextTokenInfo;
			nextTokenInfo = null;
		}
		else{
			curTokenInfo = lexer.nextTokenInfo();
		}

		token = curTokenInfo.token;
		tokenValue = curTokenInfo.value;
		//cc.log("lexer", token, tokenValue);
		return token;
	}

	function lookAhead(){
		if(nextTokenInfo === null){
			nextTokenInfo = lexer.nextTokenInfo();
		}
		return nextTokenInfo.token;
	}

	function error(desc, msg){
		let message = desc + ": " + msg + ". at line " + curTokenInfo.line + ": " + curTokenInfo.column;
		throw message;
	}

	function matchToken(desc, tk){
		if(token !== tk){
			error(desc, format("token '%s' expected, but '%s' was given", tk, token));
		}
	}

	function matchNext(desc, tk){
		next();
		return matchToken(desc, tk);
	}

	function parseValue(desc){
		if(token === TK_NUMBER || token === TK_STRING || token === TK_IDENTITY){
			return tokenValue;
		}
		else if(token === '('){
			let ret = [];

			next();
			while(token !== ')'){
				ret.push(parseValue(desc));

				next();
				if(token === ')'){
					break;
				}
				matchToken(desc, ',');
				next();
			}

			matchToken(desc, ')');
			return ret;
		}
		else{
			error(desc, format("value expected, but '%s' was given", token));
		}
	}

	function parseProperties(){
		let desc = "Properties";
		matchNext(desc, '{');

		next();
		while(token !== '}'){
			let property = {};

			matchToken(desc, TK_IDENTITY);
			let name = tokenValue;

			matchNext(desc, '(');
			matchNext(desc, TK_STRING);
			property.desc = tokenValue;

			matchNext(desc, ',');
			matchNext(desc, TK_IDENTITY);
			property.type = tokenValue;

			matchNext(desc, ')');
			matchNext(desc, '=')

			next();
			property.default = parseValue(desc);
			matchNext(desc, ';');
			
			result.properties[name] = property;
			cc.log("property", name, property);

			next();
		}

		matchToken(desc, '}');
	}

	function parsePass(){
		let desc = "Pass";
		let pass = {};

		matchNext(desc, "{");

		next();
		while(token !== '}'){
			matchToken(desc, TK_IDENTITY);
			let name = tokenValue;

			matchNext(desc, '=');

			next();
			let value = parseValue(desc);
			matchNext(desc, ';');

			pass[name] = value;

			next();
		}

		matchToken(desc, "}")
		return pass;
	}

	function parseSubshader(){
		let subshader = {
			name : "",
			passes : [],
		};
		let desc = "SubShader";

		matchNext(desc, "{");

		next();
		while(token !== '}'){
			if(token === TK_IDENTITY){
				if(tokenValue === "Pass"){
					let pass = parsePass();
					subshader.passes.push(pass);
				}
				else{
					error(desc, "Invalid token " + tokenValue);
				}
			}
			else{
				error(desc, "Invalid token " + token);
			}

			next();
		}

		matchToken(desc, "}");
		result.subshaders.push(subshader);
	}

	function parseFallback(){
		let desc = "Fallback";
		matchNext(desc, TK_STRING);
		result.fallback = tokenValue;
		matchNext(desc, ";")
	}

	function parse(content){
		lexer = Lexer(content);

		let desc = "Shader";

		next();
		if(token !== TK_IDENTITY || tokenValue !== "Shader"){
			error(desc, "keyword 'Shader' expected but " + token + " was given");
		}

		next();
		if(token === TK_STRING){
			result.shaderName = tokenValue;
			next();
		}
		matchToken(desc, '{');

		next();
		while(token !== '}'){
			if(token === TK_NULL){
				break;
			}
			if(token === ';'){
				continue;
			}
			if(token === TK_IDENTITY){
				switch(tokenValue){
				case "Properties" : parseProperties(); break;
				case "SubShader" : parseSubshader(); break;
				case "Fallback" : parseFallback(); break;
				default: error(desc, "Invalid token " + tokenValue);
				}
			}
			else{
				error(desc, "Invalid token " + token);
			}

			next();
		}

		matchToken(desc, '}');
		return true;
	}

	function parseFile(path){
		let fullPath = cc.url.raw(path);
		let content = jsb.fileUtils.getStringFromFile(fullPath);
		if(!content){
			cc.error("Failed load file", path);
			return false;
		}
		return parse(content);
	}

	function getResult(){
		return result;
	}

	function saveResult(path){
		let text = JSON.stringify(result, null, 4);
		let fullPath = cc.url.raw(path);
		jsb.fileUtils.writeStringToFile(text, fullPath);
		cc.log("save result to", fullPath);
	}

	return {
		__cname : "STShaderParser",
		parse : parse,
		parseFile : parseFile,

		getResult : getResult,
		saveResult : saveResult,
	}
}
