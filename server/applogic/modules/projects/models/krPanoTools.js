const Fs = require("fs-extra");
const Xml2js = require("xml2js");
const Path = require("path");

module.exports = function (xmlFile) {
	const log = function (...args) {
		console.log(...args);
	};
	let xml = {};
	const loadXml = function (file) {
		const parser = new Xml2js.Parser();
		return new Promise((resolve, reject) => {
			Fs.readFile(file, function (err, data) {
				if (err) {
					reject(err);
				} else {
					parser.parseString(data, function (err, result) {
						if (err) {
							reject(err);
						} else {
							xml = result.krpano;
							resolve(result.krpano);
						}
					});
				}
			});
		});
	};

	const saveXml = function () {
		const builder = new Xml2js.Builder();
		const out = {
			krpano: xml
		};
		const xmlText = builder.buildObject(out);
		return new Promise((resolve, reject) => {
			Fs.writeFile(xmlFile, xmlText, (err) => {
				if (err) {
					reject(err);
				} else {
					resolve("done");
				}
			});
		});
	};

	const createTag = function (params, body) {
		const tag = {};
		tag["$"] = params;
		tag["_"] = body;
		return tag;
	};

	const exportTag = function (tagType, tagName) {
		const i = findTagIndex(tagType, tagName);
		return {
			params: xml[tagType][i]["$"],
			body: xml[tagType][i]["_"],
		};
	};

	const findTagIndex = function (tagType, tagName) {
		return xml[tagType].findIndex((tag) => {
			return (tag.name === tagName);
		});
	};

	const object = {};

	object.load = function () {
		return loadXml(xmlFile);
	};

	object.save = function (xmlObj) {
		if (xmlObj) {
			xml = xmlObj;
		}
		return saveXml();
	};

	object.getState = function (project) {
		const iniState = project.state;
		const newState = JSON.parse(JSON.stringify(iniState));
		// check 1 - all scenes must have floor tag and this tag must be in floorSelect array
		let floorsAreSet = true;
		let hasHotspot = [];
		const floors = project.floorSelect.map(x => x.floor);
		xml.scene.forEach(scene => {
			if (!(scene["$"].floor && floors.indexOf(scene["$"].floor) >= 0)) {
				floorsAreSet = false;
			}

			if ((scene["$"].hotspot && scene["$"].hotspot === "true")) {
				if (hasHotspot.indexOf(scene["$"].floor) === -1) {
					hasHotspot.push(scene["$"].floor);
				}
			}
		});
		newState.hotspots = (floors.length === hasHotspot.length);
		newState.floors = floorsAreSet;

		// check2 - every floor must have one hotspot on scene

		return newState;
	};

	object.getTag = function (tagType, tagName) {
		return exportTag(tagType, tagName);
	};

	object.setTag = function (tagType, tagName, params, body) {
		params.name = tagName;
		const i = findTagIndex(tagType, tagName);
		const tag = createTag(params, body);
		if (i === -1) {
			xml[tagType].push(tag);
		} else {
			xml[tagType][i] = tag;
		}
	};

	object.createTag = function (tagType, tagName, params, body) {
		params.name = tagName;
		const tag = createTag(params, body);
		xml[tagType].push(tag);
	};

	return object;
};
