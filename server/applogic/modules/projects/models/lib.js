const path = require('path');
const KrPanoFile = require('./krPanoTools');
exports.calcState = function (project) {
	const iniState = project.state;
	const newState = JSON.parse(JSON.stringify(iniState));
	// check 1 - all scenes must have floor tag and this tag must be in floorSelect array
	let floorsAreSet = true;
	let hasHotspot = [];
	const floors = project.floorSelect.map(x => x.floor);
	const xml = JSON.parse(project.tour);
	if (xml.scene) {
		xml.scene.forEach(scene => {
			if (!(scene["$"].floor && floors.indexOf(scene["$"].floor) >= 0)) {
				floorsAreSet = false;
			}

			// check2 - every floor must have one hotspot on scene
			if ((scene["$"].hotspot && scene["$"].hotspot === "true")) {
				if (hasHotspot.indexOf(scene["$"].floor) === -1) {
					hasHotspot.push(scene["$"].floor);
				}
			}
		});
		newState.hotspots = (floors.length === hasHotspot.length);
		newState.floors = floorsAreSet;
	}
	return newState;
};

exports.getFoldersByProjectId = function(id, config){
	return {
		root: path.resolve(config.storageRoot, id),
		source: path.resolve(config.storageRoot, id, "source"),
		final: path.resolve(config.storageRoot, id, "final"),
	};
};

exports.updateProjectAfterUpload = function(id, config){
	const folders = this.getFoldersById(id, config);
	const tourFileName = path.resolve(folders.source, 'tour.xml');
	const tourFileTool = new KrPanoFile(tourFileName);
};
