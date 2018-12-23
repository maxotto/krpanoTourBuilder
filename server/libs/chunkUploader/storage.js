'use strict';
// https://github.com/FineUploader/node-fine-uploader-server/blob/master/lib/traditional/storage.js
let fs = require('fs-extra'),
	util = require('util'),
	path = require('path'),
	debug = require('debug')('fineuploader'),
	combined = require('combined-stream')

// Promise-ified/De-node-ified functions
// use util.promisify
let readdir = util.promisify(fs.readdir),
	stat = util.promisify(fs.stat),
	rimraf = util.promisify(require('rimraf')),
	mv = util.promisify(require('mv')),
	mkdirp = util.promisify(require('mkdirp'));

let Storage;

module.exports = Storage = function(chunksPath, uploadsPath){

	function move(oldF, newF){
		return new Promise(function(resolve, reject){
			mv(oldF, newF, { mkdirp: true }).then(function(){
				resolve();
			}, function(err) {
				reject(err);
			});
		});
	}

	function verify_num_chunks(chunk_params) {
		const sourceDir = path.resolve(chunksPath, chunk_params.identifier);
		return new Promise(function(resolve, reject){

			// check we have the same number of chunks
			readdir(sourceDir).then(function(files){
				if (files.length == chunk_params.totalChunks){
					resolve();
				} else {
					reject('Unexpected number of chunks');
				}
			}, function (err){
				reject(err);
			});

		});

	}

	function verify_size(chunk){
		var destDir = path.join(uploadsPath, chunk.uuid),
			destFile = path.join(destDir, chunk.name);

		return new Promise(function(resolve, reject){
			stat(destFile).then(function(s){
				if (s.size == chunk.totalSize){
					resolve();
				} else {
					reject('Unexpected file size');
				}
			}, function(err){
				reject(err);
			});
		});

	}

	function rm_chunks(chunk){
		var sourceDir = path.join(chunksPath, chunk.uuid);

		return new Promise(function(resolve, reject){
			rimraf(sourceDir).then(function(){
				resolve();
			}, function(err){
				reject(err);
			});
		});

	}

	return {
		/**
		 * Verify chunks
		 */
		"verify_chunks": function(chunk_params, chunk_file) {
			return new Promise(function(resolve, reject){
				verify_num_chunks(chunk_params).then(function() {
					console.log('chunks verified');
					resolve('chunks verified');
				}, function(err){
					console.log('chunks rejected');
					reject(err);
				});
			});

		},

		/**
		 * Verifies a file has been succesfully upload
		 */
		verify_upload: function(chunk){
			return new Promise(function(resolve, reject) {
				verify_num_chunks(chunk).then(function() {
					console.log('chunks verified');
					verify_size(chunk).then(function() {
						console.log('size verified');
						resolve();
					}, function(err) {
						console.log('size rejected');
						reject(err);
					});
				}, function(err){
					console.log('chunks rejected');
					reject(err);
				});
			});
		},

		/**
		 * Deletes the file saved under `uuid` and its containing folder.
		 *
		 * @param uuid string The file's unique idenfitier assigned by Fine Uploader
		 */
		delete_file: function(uuid){
			return new Promise(function (resolve, reject){

				var dirToDelete = path.join(uploadsPath, uuid);

				rimraf(dirToDelete).then(function(){
					resolve();
				}, function(error){
					reject(error);
				});
			});

		},

		/**
		 * Store a file
		 */
		store_file:  function(file){
			var destinationDir = path.join(uploadsPath, file.uuid),
				newPath = path.join(destinationDir, file.name);

			return new Promise(function(resolve, reject){
				return move(file.file.path, newPath).then(function(){
					return resolve(newPath);
				}, function(err){
					reject(err);
				});

			});
		},

		/**
		 * Store a chunk
		 */
		store_chunk: function(chunk_params, chunk_file) {

			// убедиться, что папка chunksPath/identifier существует
			const destDir = path.resolve(chunksPath, chunk_params.identifier);
			fs.ensureDirSync(destDir);
			const chunkName = chunk_params.filename + '.part' + chunk_params.chunkNumber.padStart(4, '0');
			const	newPath = path.join(destDir, chunkName);

			return new Promise(function(resolve, reject){
				move(chunk_file.path, newPath).then(function(){
					console.log('got chunk ' + chunk_params.chunkNumber + ' of ' + (chunk_params.totalChunks));
					resolve(newPath);
				}, function(err){
					reject(err, true);
				});
			});
		},

		/**
		 * assemble chunks
		 */
		assemble_chunks: function(chunk_params, chunk_file) {
			const sourceDir = path.resolve(chunksPath, chunk_params.identifier);
			const destDir = path.join(uploadsPath, chunk_params.identifier);
			fs.ensureDirSync(destDir);
			return new Promise(function(resolve, reject){
				readdir(sourceDir).then(function(files){
					files.sort();

					mkdirp(destDir).then(function(){
						console.log('assembling chunks for ' + chunk_params.identifier);
						var destFile = path.join(destDir, chunk_params.filename),
							combinedStream = combined.create(),
							destStream = fs.createWriteStream(destFile);

						files.forEach(function(file, index){
							var srcFile = path.join(sourceDir, file),
								totalChunks = files.length-1;

							console.log('read chunk #'+index+'/'+totalChunks);

							combinedStream.append(function(next){
								var srcStream = fs.createReadStream(srcFile);
								next(srcStream);

								console.log("Adding chunk: " + srcFile + " to stream");
							});
						});

						combinedStream
							.on('error', function(e){
								reject(e, true);
							})
							.on('end', function(){
								console.log('chunks assembled for ' + chunk_params.identifier);
								rimraf(sourceDir).then(function(){
									console.log('chunks dir removed ' + sourceDir);
									resolve();
								});
							});

						destStream
							.on('error', function(e){ reject(e, true); });

						combinedStream.pipe(destStream);


					}, function(err) {
						reject(err);
					});

				}, function(err){
					reject(err);
				});
			});
		}


	};
};

