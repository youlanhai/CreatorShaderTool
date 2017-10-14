let fs = null;

if(CC_EDITOR){
	fs = require("fs");
}

function isAbsPath(path){
	return path[0] === '/' || path[1] === ':';
}

export function readFile(path){
	let fullPath = path;
	if(!isAbsPath(path)){
		fullPath = cc.url.raw(path);
	}
	let content = null;
	if(CC_EDITOR){
		content = fs.readFileSync(fullPath, {encoding: "utf-8"});
	}
	else if (cc.sys.isNative) {
		content = jsb.fileUtils.getStringFromFile(fullPath);
	}
	else{
		cc.error("doens't support read file sync on this platform");
	}

	if(!content){
		cc.error("file was not found", fullPath);
	}
	return content;
}

export function writeFile(path, content){
	let fullPath = path;
	if(!isAbsPath(path)){
		fullPath = cc.url.raw(path);
	}
	if(CC_EDITOR){
		fs.writeFileSync(fullPath, content);
	}
	else if(cc.sys.isNative){
		jsb.fileUtils.writeStringToFile(content, fullPath);
	}
	else{
		cc.error("doens't support write file sync on this platform");
		return false;
	}
	return true;
}

export function loadJsonFile(path){
	let content = readFile(path);
	if(!content){
		return null;
	}

	let data = JSON.parse(content);
	if(!data){
		cc.error("failed parse json file", path);
		return null;
	}
	return data;
}

export function saveJsonFile(path, data){
	let content = JSON.stringify(data, null, 4);
	return writeFile(path, content);
}
