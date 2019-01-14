"use strict";

let logger 		= require("../../../core/logger");
let config 		= require("../../../config");
let C 	 		= require("../../../core/constants");

let _			= require("lodash");

let Project 		= require("./models/project");
let multiparty = require("multiparty");
let uploader = require("../../../libs/chunkUploader")({
	uploads: "c:\\chunks"
});
const unzipper = require("../../../libs/unzipper");
const localLib = require("./models/lib");
const fs = require("fs-extra");
const path = require("path");
const KrPanoFile = require("./models/krPanoTools");
const xmlReader = require("./models/xmlReader");
const xmlWriter = require("./models/xmlSaver");
const build = require("./models/build");
const debug = require("debug")("projects");

module.exports = {
	settings: {
		name: "projects",
		version: 1,
		namespace: "projects",
		rest: true,
		ws: true,
		graphql: false,
		permission: C.PERM_LOGGEDIN,
		role: "user",
		collection: Project,
		idParamName: "_id",

		// modelPropFilter: "_id user title address floorSelect template location showMap useCustomMap language loadingtext googleMapUnits useFixedZoom iniZoom state tour"
	},
	resources:{
		"fromtour/scene/thumb":{
			cache: true,
			handler(ctx){
				this.validateParams(ctx);
				const scene = ctx.params.scene;
				const sceneFolder = scene.substring(6) + ".tiles";
				console.log(ctx.params);
				return this.collection.findById(ctx.modelID).exec()
					.then((project) => {
						const folders = localLib.getFoldersByProjectId(ctx.params._id, config);
						const mapsFolder = path.resolve(folders.source, "panos", sceneFolder);
						return Promise.resolve(path.resolve(mapsFolder, "thumb.jpg"));
					});

			}
		},
		"getimage/floormap": {
			cache: false,
			handler(ctx){
				this.validateParams(ctx);
				console.log(ctx.params);
				return this.collection.findById(ctx.modelID).exec()
					.then((project) => {
						console.log(project.floorSelect);
						const index = project.floorSelect.findIndex((element) => {
							return (element.floor === ctx.params.floor);
						});
						const imageName = project.floorSelect[index].image;
						const folders = localLib.getFoldersByProjectId(ctx.params._id, config);
						const mapsFolder = path.resolve(folders.source, "custom");
						return Promise.resolve(path.resolve(mapsFolder, imageName));
					});
			}
		},
		"getimage/fromtemplate/floorselector": {
			cache: true,
			handler(ctx) {
				this.validateParams(ctx);
				console.log(ctx.params);
				return this.collection.findById(ctx.modelID).exec()
					.then((doc) => {
						const imageName = ctx.params.n + "Floor" + (ctx.params.t=="up"?"Up":(ctx.params.t=="down"?"Down":ctx.params.t)) + ".jpg";
						const templateFolder = localLib.getImagePathByTemplate(doc.template, config);
						return Promise.resolve(path.resolve(templateFolder, "ext", "tour", imageName));
					});
			}
		},
		"getimage/fromtemplate/radar": {
			cache: true,
			handler(ctx) {
				this.validateParams(ctx);
				console.log(ctx.params);
				return this.collection.findById(ctx.modelID).exec()
					.then((doc) => {
						const templateFolder = localLib.getImagePathByTemplate(doc.template, config);
						return Promise.resolve(path.resolve(templateFolder, "ext", "tour", "camicon.png"));
					});
			}
		},
	},
	actions: {
		"saveplaneditdata":{
			cache: false,
			handler(ctx){
				ctx.assertModelIsExist(ctx.t("app:ProjectNotFound"));
				this.validateParams(ctx);
				return this.collection.findById(ctx.modelID).exec()
					.then(project => {
						console.log(ctx.params);
						const writer = new xmlWriter(config, ctx.modelID, ctx.params, ctx.params.type);
						return writer.write()
							.then(res => {
								return localLib.checkTour(ctx.modelID, config)
									.then((xml) => {
										if (xml === false){
											return Promise.reject("XML is not valid after setting floor hotspots");
										} else {
											project.tour = JSON.stringify(xml);
											return Promise.resolve(project);
										}
									})
									.then((project) => {
										return project.save()
											.then((project) => {
												return this.toJSON(project);
											})
											.then((json) => {
												return this.populateModels(json);
											})
											.then((json) => {
												this.notifyModelChanges(ctx, "updated", json);
												return {
													operation: "savePlanHotspots",
													success: true,
													project: json,
												};
											});
									}, err => {
										console.log(err);
										return Promise.resolve({
											operation: "savePlanHotspots",
											success: false,
											error: err,
										});
									});
							});
					})
					.then(
						result => {
							return Promise.resolve(result);
						}, 
						err=> {console.log({err});})
					.catch(err => {console.log(err);});

			}
		},
		"getplaneditdata":{
			cache: false,
			handler(ctx){
				ctx.assertModelIsExist(ctx.t("app:ProjectNotFound"));
				this.validateParams(ctx);
				return this.collection.findById(ctx.modelID).exec()
					.then(project => {
						const reader = new xmlReader(config, ctx.modelID);
						return reader.read();
					});
			}
		},
		"build":{
			cache: false,
			handler(ctx){
				ctx.assertModelIsExist(ctx.t("app:ProjectNotFound"));
				this.validateParams(ctx);
				return this.collection.findById(ctx.modelID).exec()
					.then(project => {
						return build.run(project, config, ctx)
							.then((res) => {
								project.state.built = true;
								project.state.lookatTag = true;
								project.markModified("state.built");
								project.markModified("state.lookatTag");
								return project.save()
									.then((project) => {
										return this.toJSON(project);
									})
									.then((json) => {
										return this.populateModels(json);
									})
									.then((json) => {
										this.notifyModelChanges(ctx, "updated", json);
										logger.debug(json);
										return Promise.resolve({
											success: true,
											message: "Build process is finished.",
											project: json,
										});
									});
							}, err => {console.log(err);});
					}, err => {console.log(err);});
			}
		},
		"delete/floorImage":{
			cache: false,
			handler(ctx){
				const floor = ctx.params.floor;
				ctx.assertModelIsExist(ctx.t("app:ProjectNotFound"));
				this.validateParams(ctx);
				let foundIndex;
				let fileToDel;
				return this.collection.findById(ctx.modelID).exec()
					.then(project=>{
						foundIndex = project.floorSelect.findIndex((element) => {
							return (element.floor === floor);
						});
						if (foundIndex >= 0) {
							fileToDel = project.floorSelect[foundIndex].image;
							project.floorSelect.splice(foundIndex,1);
							project.state.floorsImages = (project.floorSelect.length >0);
							project.state = localLib.calcState(project);
							return project.save()
								.then((project) => {
									return this.toJSON(project);
								})
								.then((json) => {
									return this.populateModels(json);
								})
								.then((json) => {
									this.notifyModelChanges(ctx, "updated", json);
									return json;
								});

						} else {
							return Promise.reject(
								{
									success: false,
									message: 'No floor to delete',
								}
							);
						}
					})
					.then(project=> {
						return new Promise((resolve, reject) => {
							const folders = localLib.getFoldersByProjectId(ctx.params._id, config);
							const folder = path.resolve(folders.source, "custom");
							fs.remove(path.resolve(folder,fileToDel), err => {
								if (err) {
									console.log(err);
									reject(err);
								} else {
									resolve({
										success: true,
										message: "Floor deleted",
										project: project,
									});
								}
							});
						});
					});
			}
		},
		"upload/floorImage":{
			cache:false,
			handler(ctx){
				const floor = ctx.params.floor;
				let newFileName;
				let resultToSend;
				this.validateParams(ctx);
				const form = new multiparty.Form();
				return new Promise(function(resolve, reject){
					form.parse(ctx.req, function(err, fields, files) {
						if (err) {
							reject(err);
						} else {
							const _fields = {};
							Object.keys(fields).forEach(function(key) {
								_fields[key] = fields[key][0];
							});
							resolve({
								fields: _fields,
								file: files.file[0],
							});
						}
					});
				}).then(uploadInfo=>{
					const folders = localLib.getFoldersByProjectId(ctx.params._id, config);
					const destFolder = path.resolve(folders.source, "custom");
					fs.ensureDirSync(destFolder);
					const filename = uploadInfo.file.originalFilename;
					const parts = path.parse(filename);
					newFileName = "map_" + floor + "_floor" + parts.ext;
					return uploader.simpleUpload(uploadInfo.file.path, destFolder, newFileName, {floor: floor, file: newFileName});
				}).then(res => {
					resultToSend = res;
					ctx.assertModelIsExist(ctx.t("app:ProjectNotFound"));
					this.validateParams(ctx);
					return this.collection.findById(ctx.modelID).exec()
						.then((project) => {
							// console.log(project);
							if (!project.floorSelect) {
								project.floorSelect = [];
							}
							const index = project.floorSelect.findIndex((element) => {
								return (element.floor === floor);
							});
							if (index === -1) {
								project.floorSelect.push(
									{
										floor: floor,
										image: newFileName,
									}
								);
							} else {
								project.floorSelect[index].image = newFileName;
							}
							project.state.floorsImages = true;
							project.state = localLib.calcState(project);

							project.state.uploaded = true;
							return project.save()
								.then((project) => {
									return this.toJSON(project);
								})
								.then((json) => {
									return this.populateModels(json);
								})
								.then((json) => {
									this.notifyModelChanges(ctx, "updated", json);
									resultToSend.project = json;
									return resultToSend;
								});
						});
				}).then((res) =>{
					console.log({res});
					return Promise.resolve(res);
				});
			}
		},
		upload: {
			cache: false,
			handler(ctx) {
				this.validateParams(ctx);
				const folders = localLib.getFoldersByProjectId(ctx.params._id, config);
				const form = new multiparty.Form();
				let folderToDel;
				let fileToUnzip;
				return new Promise(function(resolve, reject){
					form.parse(ctx.req, function(err, fields, files) {
						if (err) {
							reject(err);
						} else {
							const _fields = {};
							Object.keys(fields).forEach(function(key) {
								_fields[key] = fields[key][0];
							});
							resolve({
								fields: _fields,
								file: files.file[0],
							});
						}
					});
				})
					.then((chunk) => {
						return uploader.upload(chunk.fields, chunk.file);
					})
					.then((uploadRes) => {
						fileToUnzip = uploadRes.file;
						folderToDel = uploadRes.folder;
						// unzip here to project Infolder
						// return Promise.resolve(true);
						return unzipper(fileToUnzip, folders.source)
							.then((unzipRes) => {
								ctx.assertModelIsExist(ctx.t("app:ProjectNotFound"));
								this.validateParams(ctx);
								return this.collection.findById(ctx.modelID).exec()
									.then((doc) => {
										return localLib.checkTour(ctx.modelID, config)
											.then((xml) => {
												console.log(xml);
												if (xml === false){
													return Promise.reject('Zip file is not krpano tour!');
												} else {
													doc.tour = JSON.stringify(xml);
													return Promise.resolve(doc);
												}
											});
									})
									.then((doc) => {
										// console.log(doc);
										doc.state.uploaded = true;
										return doc.save()
											.then((doc) => {
												return this.toJSON(doc);
											})
											.then((json) => {
												return this.populateModels(json);
											})
											.then((json) => {
												this.notifyModelChanges(ctx, "updated", json);
												unzipRes.project = json;
												return unzipRes;
											});
									}, err => {
										console.log(err);
										return Promise.resolve({
											operation: "unzip",
											success: false,
											error: err,
										});
									});

							})
							.then((unzipRes) => {
								return new Promise((resolve, reject) => {
									// fs.removeSync(fileToUnzip);
									fs.removeSync(folderToDel);
									resolve(unzipRes);
								});
							});

					}, (err) => {console.log("Upload after not last chunk", err);});
			}
		},
		list: {
			cache: false,
			handler(ctx) {
				console.log(ctx.req.user);
				const userId = ctx.req.user._id;
				let filter = {
					user: userId
				};
				let query = Project.find(filter);
				setTimeout(()=>{
					// ctx.emit('test',{test: 20},ctx.user.role);
				},10000);
				return ctx.queryPageSort(query).exec().then( (docs) => {
					return this.toJSON(docs);
				});
			}
		},

		// return a model by ID
		get: {
			cache: true,
			handler(ctx) {
				ctx.assertModelIsExist(ctx.t("app:ProjectsNotFound"));
				return Promise.resolve(ctx.model);
			}
		},

		create(ctx) {
			this.validateParams(ctx, true);
			const data = ctx.params;
			data.user = ctx.req.user._id;
			let project = new Project(data);

			return project.save()
				.then((doc) => {
					return this.toJSON(doc);
				})
				.then((json) => {
					return this.populateModels(json);
				})
				.then((json) => {
					this.notifyModelChanges(ctx, "created", json);
					return json;
				});
		},

		update(ctx) {
			ctx.assertModelIsExist(ctx.t("app:ProjectNotFound"));
			this.validateParams(ctx);

			return this.collection.findById(ctx.modelID).exec()
				.then((doc) => {
					for (let key in ctx.params) {
						if (ctx.params.hasOwnProperty(key)) {
							doc[key] = ctx.params[key];
						}
					}
					return doc.save();
				})
				.then((doc) => {
					return this.toJSON(doc);
				})
				.then((json) => {
					return this.populateModels(json);
				})
				.then((json) => {
					this.notifyModelChanges(ctx, "updated", json);
					return json;
				})
				.then( json => {
					return localLib.saveTour(ctx.modelID, json.tour, config)
						.then(done => {return Promise.resolve(json);});
				});
		},

		remove(ctx) {
			ctx.assertModelIsExist(ctx.t("app:ProjectNotFound"));

			return Project.remove({ _id: ctx.modelID })
				.then(() => {
					return localLib.deleteTourFolder(ctx.modelID, config);
				})
				.then(() => {
					return ctx.model;
				})
				.then((json) => {
					this.notifyModelChanges(ctx, "removed", json);
					return json;
				});
		}

	},

	methods: {
		/**
		 * Validate params of context.
		 * We will call it in `create` and `update` actions
		 *
		 * @param {Context} ctx 			context of request
		 * @param {boolean} strictMode 		strictMode. If true, need to exists the required parameters
		 */
		validateParams(ctx, strictMode) {

			if (ctx.hasValidationErrors())
				throw ctx.errorBadRequest(C.ERR_VALIDATION_ERROR, ctx.validationErrors);
		}
	},

	init(ctx) {
		// Fired when start the service
	},

	socket: {
		afterConnection(socket, io) {
			console.log("Socket connected for projects");
			logger.debug("Socket connected for projects");
			// Fired when a new client connected via websocket
		}
	},

	graphql: {}

};
