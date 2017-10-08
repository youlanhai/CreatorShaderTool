
export function loadJsonFile(path){
	let fullPath = cc.url.raw(path);
	let jsonData = jsb.fileUtils.getStringFromFile(fullPath);
	if(!jsonData){
		cc.error("file was not found", fullPath);
		return null;
	}

	let data = JSON.parse(jsonData);
	if(!data){
		cc.error("failed parse ship data file", fullPath);
		return null;
	}
	return data;
}
