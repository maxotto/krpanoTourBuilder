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

	actions: {
		upload: {
			cache: false,
			handler(ctx) {
				const fields = [];
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
			// Fired when a new client connected via websocket
		}
	},

	graphql: {}

};
