"use strict";

let logger 		= require("../../../core/logger");
let config 		= require("../../../config");
let C 	 		= require("../../../core/constants");

let _			= require("lodash");

let Project 		= require("./models/project");
let multiparty = require('multiparty');

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

		// modelPropFilter: "_id user title address floorSelect template location showMap useCustomMap language loadingtext googleMapUnits useFixedZoom iniZoom state tour"
	},

	actions: {
		upload: {
			cache: false,
			handler(ctx) {
				const fields = [];
				this.validateParams(ctx);
				const form = new multiparty.Form();
				form.parse(ctx.req, function(err, fields, files) {
					console.log({err}, {fields}, {files});
				});

				return Promise.resolve('From promise');
				// return JSON.stringify(ctx.req);
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
				ctx.assertModelIsExist(ctx.t("app:DeviceNotFound"));
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
