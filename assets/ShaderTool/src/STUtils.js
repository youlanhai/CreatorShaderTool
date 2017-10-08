
export function readFile(path){
	let fullPath = cc.url.raw(path);
	let content = null;
	if (cc.sys.isNative) {
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
	let fullPath = cc.url.raw(path);
	if(cc.sys.isNative){
		jsb.fileUtils.writeStringToFile(content, fullPath);
	}
	else{
		cc.error("doens't support write file sync on this platform");
	}
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
