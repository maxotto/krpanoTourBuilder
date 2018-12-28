const localLib = require("./lib");

exports.run = function(project, main_config){
	const folders = localLib.getFoldersByProjectId(project.id, main_config);
	const config = {
		// socket: io,
		inFolder: folders.source,
		outFolder: folders.final,
		templatesFolder: localLib.getImagePathByTemplate(project.template, main_config),
		googleApiKey: 'AIzaSyARIMiX_C7rE4U-pM6nih2n2z2z0YfhrfY',
		showMap: project.showMap,
		useCustomMap: project.useCustomMap,
		language: project.language,
		loadingtext: project.loadingtext,
		googleMapUnits: project.googleMapUnits,
		mapCenter: {
			lat: project.location.lat,
			lng: project.location.lng
		},
		useFixedZoom: project.useFixedZoom,
		iniZoom: project.iniZoom,
		title: project.title,
		floorMapShift:{
			x: 0,
			y: 60,
		},
		floorSelect: project.floorSelect,
	};
	console.log("Builder run 1");
	return buildMe(config);
};

const buildMe = function(config){
	console.log("inside buildMe", config.templatesFolder+'/tourBuilder');
	const Builder = require(config.templatesFolder+'/tourBuilder');
	const myBuilder = Builder(config, undefined);
	return myBuilder.run();
};
