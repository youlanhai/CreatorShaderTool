'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.loadJsonFile = loadJsonFile;
exports.saveJsonFile = saveJsonFile;
var fs = null;

if (CC_EDITOR) {
	fs = require("fs");
}

function isAbsPath(path) {
	return path[0] === '/' || path[1] === ':';
}

function readFile(path) {
	var fullPath = path;
	if (!isAbsPath(path)) {
		fullPath = cc.url.raw(path);
	}
	var content = null;
	if (CC_EDITOR) {
		content = fs.readFileSync(fullPath, { encoding: "utf-8" });
	} else if (cc.sys.isNative) {
		content = jsb.fileUtils.getStringFromFile(fullPath);
	} else {
		cc.error("doens't support read file sync on this platform");
	}

	if (!content) {
		cc.error("file was not found", fullPath);
	}
	return content;
}

function writeFile(path, content) {
	var fullPath = path;
	if (!isAbsPath(path)) {
		fullPath = cc.url.raw(path);
	}
	if (CC_EDITOR) {
		fs.writeFileSync(fullPath, content);
	} else if (cc.sys.isNative) {
		jsb.fileUtils.writeStringToFile(content, fullPath);
	} else {
		cc.error("doens't support write file sync on this platform");
		return false;
	}
	return true;
}

function loadJsonFile(path) {
	var content = readFile(path);
	if (!content) {
		return null;
	}

	var data = JSON.parse(content);
	if (!data) {
		cc.error("failed parse json file", path);
		return null;
	}
	return data;
}

function saveJsonFile(path, data) {
	var content = JSON.stringify(data, null, 4);
	return writeFile(path, content);
}