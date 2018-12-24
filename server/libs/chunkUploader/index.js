"use strict";
const assert = require("assert");
const path = require("path");
const debug = require("debug")("chunkUploader");

const Storage = require("./storage");

module.exports = function(opts) {
	assert(typeof opts.uploads === "string" ,"Uploads directory required");
	// rrots for chunks and final files
	const chunksPath = path.join(opts.uploads, "chunks");
	const	uploadsPath = path.join(opts.uploads, "uploads");

	const storage = new Storage(chunksPath, uploadsPath);


	return {
		"upload": function(chunk_params, chunk_file){
			console.log("chunk received");
			const uploadedFile = {};
			return storage.store_chunk(chunk_params, chunk_file)
				.then(() => {
					return storage.verify_chunks(chunk_params, chunk_file);
				})
				.then(() => {
					console.log('Need to assemble');
					return storage.assemble_chunks(chunk_params, chunk_file);
				}, (err)=>{
					console.log("Reject chunk ->",err);
					return Promise.reject(new Error(err));
				})
			;
		}
	};
};
