
let TK_NULL = null;
let TK_IDENTITY = 257;
let TK_STRING = 258;
let TK_NUMBER = 259;

let BLANK_CHARS = "\t \r\n\b\f"
let NUMBER_CHARS = "0123456789";
let ALPHABET_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
let IDENTITY_CHARS = ALPHABET_CHARS + NUMBER_CHARS + "_";

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

	return {
		next : next,

		getValue(){
			return value;
		}
	}
}

export default function STShaderParser(){
	let lexer = null;

	function next(){
		return lexer.next();
	}

	function parse(content){
		lexer = Lexer(content);

		while(true){
			let token = next();
			if(token == TK_NULL){
				break;
			}

			if(token == TK_NUMBER || token == TK_STRING || token == TK_IDENTITY){
				cc.log("parse", token, lexer.getValue());
			}
			else{
				cc.log("parse", token);
			}
		}
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

	return {
		__cname : "STShaderParser",
		parse : parse,
		parseFile : parseFile,
	}
}
