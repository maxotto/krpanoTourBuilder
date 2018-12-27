"use strict";
const assert = require("assert");
const path = require("path");
const debug = require("debug")("chunkUploader");
const fs = require("fs-extra");

const Storage = require("./storage");

module.exports = function(opts) {
	assert(typeof opts.uploads === "string" ,"Uploads directory required");
	// rrots for chunks and final files
	const chunksPath = path.join(opts.uploads, "chunks");
	const	uploadsPath = path.join(opts.uploads, "uploads");

	const storage = new Storage(chunksPath, uploadsPath);


	return {
		"upload": function(chunk_params, chunk_file){
			const uploadedFile = {};
			return storage.store_chunk(chunk_params, chunk_file)
				.then(() => {
					return storage.verify_chunks(chunk_params, chunk_file);
				})
				.then(() => {
					return storage.assemble_chunks(chunk_params, chunk_file);
				}, (err)=>{
					return Promise.reject(new Error(err));
				})
			;
		},
		"simpleUpload": function(uploadedFile, destFolder, destName, response){
			console.log({uploadedFile},{destFolder},{destName});
			return new Promise((resolve, reject) => {
				fs.remove(path.resolve(destFolder, destName), err => {
					if(err) {
						console.log("remove err=", err);
						reject(err);
					} else {
						fs.move(uploadedFile, path.resolve(destFolder, destName), err => {
							if (err) {
								console.log("move err=",err);
								reject(err);
							} else {
								response.success = true;
								resolve(response);
							}
						});

					}
				});
			});
		}
	};
};
