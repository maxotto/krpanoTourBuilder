const Fs = require("fs-extra");
const Xml2js = require("xml2js");
const Path = require("path");
const utils = require("./lib");

module.exports = function (config, id, data, dataType) {
	const log = function (...args) {
		console.log(...args);
	};
	// todo workPath depends on template used. Invent config for this
	const folders = utils.getFoldersByProjectId(id, config);
	const extPath = Path.resolve(folders.final, "ext/tour");
	const tourXmlPath = Path.resolve(folders.final, "tour.xml");
	const floorMapXmlPath = Path.resolve(extPath, "floorMap.xml");
	const floorMapXmlPath1 = Path.resolve(extPath, "floorMapTest.xml");
	const hotSpotParents = {};
	// log("Xml writer created with config", config);

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
							resolve(result);
						}
					});
				}
			});
		});
	};

	const saveXml = function (xmlObject, file) {
		const builder = new Xml2js.Builder();
		const xmlText = builder.buildObject(xmlObject);
		return new Promise((resolve, reject) => {
			Fs.writeFile(file, xmlText, (err) => {
				if (err) {
					log(err);
					reject(err);
				} else {
					resolve(file + " saved.");
				}
			});
		});
	};

	const updateXml = function (xml, data) {
		const hotspots = {};
		data.hotspots.forEach(hs => {
			hotspots[hs.name] = hs;
		});
		xml.krpano.layer.forEach((l, i) => {
			const layerName = l['$'].name;
			if (hotspots.hasOwnProperty(layerName)) {
				xml.krpano.layer[i]['$'] = {
					name: hotspots[layerName]["name"],
					style: hotspots[layerName]["style"],
					x: hotspots[layerName]["x"],
					y: hotspots[layerName]["y"],
					zorder: hotspots[layerName]["zorder"],
					onclick: hotspots[layerName]["onclick"],
				};
			}
		});
		return (xml);
	};

	const updateMainTour = function (tourXml, data) {
		const angles = {};
		data.hotspots.forEach(hs => {
			let parentName = hs.parent.name;
			angles[hs.parent.name] = {
				name: hs.name,
				angle: hs.parent.angle
			};
		});
		tourXml.krpano.scene.forEach((scene, i) => {
			if (angles.hasOwnProperty(scene['$'].name)) {
				let hsName = angles[scene['$'].name].name;
				let searchStr = "updateradar(" + hsName + ",";
				let pos = scene['$'].onstart.indexOf(searchStr);
				tourXml.krpano.scene[i]['$'].onstart = tourXml.krpano.scene[i]['$'].onstart.substring(0, pos) + searchStr + angles[scene['$'].name].angle + ");";
			}
		});
		return tourXml;
	};

	const updateMainTourLookAt = function (tourXml, data) {
		const angles = {};
		for (let scene in data.scenesData) {
			if (data.scenesData.hasOwnProperty(scene)) {
				if (!angles.hasOwnProperty(scene)) {
					angles[scene] = [];
				}
				if (data.scenesData[scene].hotspots) {
					data.scenesData[scene].hotspots.forEach((hs) => {
						angles[scene].push({
							name: hs.name,
							angle: hs.linkedscene_lookat
						});
					});
				}
			}
		}

		tourXml.krpano.scene.forEach((scene, i) => {
			if (angles.hasOwnProperty(scene['$'].name)) {
				angles[scene['$'].name].forEach((ahs) => {
					let hsName = ahs.name;
					scene.hotspot.forEach((hs, j) => {
						if (hs['$'].name === hsName) {
							tourXml.krpano.scene[i].hotspot[j]['$'].linkedscene_lookat = ahs.angle;
						}
					});
				});
			}
		});

		return tourXml;
	};

	const writer = {};

	const floorSaver = function () {
		console.log("floorSaver 1");
		return loadXml(floorMapXmlPath)
			.then(xml => {
				console.log("floorSaver 2");
				const updated = updateXml(xml, data);
				return saveXml(updated, floorMapXmlPath);
			})
			.then((message) => {
				console.log("floorSaver 3");
				console.log(message);
				return loadXml(tourXmlPath);
			})
			.then(tourXml => {
				console.log("floorSaver 4");
				const updated = updateMainTour(tourXml, data);
				return saveXml(updated, tourXmlPath);
			});
	};

	const lookAtSaver = function () {
		return loadXml(tourXmlPath)
			.then(tourXml => {
				const updated = updateMainTourLookAt(tourXml, data);
				return saveXml(updated, tourXmlPath);
			});
	};
	writer.write = function () {
		switch (dataType) {
		case "floor":
			return floorSaver();
		case "lookat":
			return lookAtSaver();
		default:
			console.log("Wrong data type = ", {dataType});
		}
	};

	return writer;
};
