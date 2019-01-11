import axios from "axios";

export default {
	fetchProjects() {
		return axios.get("api/projects/list");
	},

	addProject(params) {
		return axios.post("api/projects/create", params);
	},

	updateProject(params) {
		return axios.put("api/projects/" + params.id, params);
	},

	getProject(id) {
		return axios.get("api/projects/" + id);
	},

	getPlanEditData(id){
		return axios.get("api/projects/" + id + "/getplaneditdata");
	},

	getProjectXml(id) {
		return axios.get("api/projects/" + id + "/xml");
	},

	saveProjectXml(id, xml) {
		return axios.post("api/projects/" + id + "/xml", xml);
	},

	deleteProject(id) {
		return axios.delete("api/projects/" + id);
	},

	buildProject(id) {
		console.log("Start build")
		// return Promise.resolve("XXX");
		return axios.get("api/projects/" + id + "/build");
	}


};
