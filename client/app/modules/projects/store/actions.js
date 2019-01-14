import Vue from "vue";
import toastr from "../../../core/toastr";
import { LOAD, ADD, SELECT, CLEAR_SELECT, UPDATE, REMOVE } from "./types";
import projectService from "./ProjectsService";

import Service from "../../../core/service";
let service = new Service("project", this);

export const saveFloorJob = ({commit}, data) => {
	console.log({data});
	projectService.savePlanEditData(data.id, data);
};

export const getPlanEditInfo = ({commit}, id) => {
	projectService.getPlanEditData(id)
		.then(response => {
			let res = response.data;
			if (res.status === 200 && res.data){
				commit("setPlanEditInfo", res.data);
			} else {
				console.log("Status is not 200!", response);
			}
		})
		.catch((response) => {
			console.error("Request error!", response.statusText);
		});
};

export const clearBuildLog = ({ commit }) => {
	commit("clearBuildLog");
};

export const addBuildLogMessage = ({ commit }, message) => {
	commit("addBuildLogMessage", message);
};

export const selectRow = ({ commit }, row, multiSelect) => {
	commit(SELECT, row, multiSelect);
};

export const clearSelection = ({ commit }) => {
	commit(CLEAR_SELECT);
};

export const downloadRows = ({ commit }) => {
	console.log('downloadRows');
	service.emit("Download rows").then((newValue) => {
		console.log("downloadRows after emit.");
	});
	projectService.fetchProjects().then((response) => {
		let res = response.data;
		if (res.status == 200 && res.data)
			commit(LOAD, res.data);
		else
			console.error("Request error!", res.error);

	}).catch((response) => {
		console.error("Request error!", response.statusText);
	});

};

export const saveRow = ({ commit }, model) => {
	projectService.addProject(model).then((response) => {
		let res = response.data;

		if (res.status == 200 && res.data)
			created({ commit }, res.data, true);
	}).catch((response) => {
		if (response.data.error)
			toastr.error(response.data.error.message);
	});		
};

export const created = ({ commit, state }, row, needSelect) => {
	state.errors={};
	state.success = false;
	projectService.addProject(row).then((response)=> {
		//New _ID comes - need to save it too
		// console.log(response.data.data._id);
		row._id = response.data.data._id;
		commit(ADD, row);
		state.success = true;
		if (needSelect)
			commit(SELECT, row, false);
	}).catch(err => {
		state.errors=err.response.data.error.errors;
	});
};

export const updateRow = ({ commit, state }, row) => {
	state.errors={};
	state.success = false;
	projectService.updateProject(row).then((response) => {
		let res = response.data;
		if (res.data){
			state.success = true;
			commit(UPDATE, res.data);
		} else {
			state.errors={"error":"error"};
		}
	}).catch((err) => {
		state.errors=err.response.data.error.errors;
	});	
};

export const updated = ({ commit }, row) => {
	commit(UPDATE, row);
};

export const removeRow = ({ commit }, row) => {
	projectService.deleteProject(row._id).then((response) => {
		commit(REMOVE, row);
	}).catch((response) => {
		if (response.data.error)
			toastr.error(response.data.error.message);
	});
};

export const removed = ({ commit }, row) => {
	commit(REMOVE, row);
};
