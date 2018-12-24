"use strict";
const fs = require("fs-extra");
const unzip = require("unzipper");

module.exports = function (zipFile, destFolder) {
	console.log(zipFile, destFolder);
	return new Promise(function(resolve, reject){
		fs.ensureDir(destFolder, err => {
			if(err) {
				reject(err);
			} else {
				resolve();
			}
		});
	})
		.then(()=>{
			return new Promise((resolve, reject) => {
				fs.emptyDir(destFolder, err =>{
					if(err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		})
		.then(() => {
			console.log(destFolder, "exists and is empty");
			return _unzip(zipFile, destFolder, (entry) => {
				// console.log(entry, "unzipped");
			});
		});
};

function _unzip(zipFile, destFolder, cb){
	return new Promise(function(resolve, reject) {
		console.log("Inside UNZIP promise");
		const stream = fs.createReadStream(zipFile)
			.pipe(unzip.Extract({ path: destFolder })
				.on("entry", (entry)=> {
					if(cb) cb(entry.path);
				})
				.on("error", err => {reject(err);})
				.on("finish", () => {
					console.log("UnZIP finished");
					stream.destroy();
					resolve({
						operation: "unzip",
						success: true,
					});
				})
				.on("close", () => {
					// console.log("ZIP close");
				})
			);
	});
}
