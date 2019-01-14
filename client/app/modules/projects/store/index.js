import { LOAD, ADD, SELECT, CLEAR_SELECT, UPDATE, REMOVE } from "./types";

import { each, find, assign, remove, isArray } from "lodash";

const state = {
	rows: [],
	selected: [],
	errors: {},
	success: false,
	buildLog: [],
	planEditInfo: {},
	saving: false
};

const mutations = {

	setSaving(state,  val){
		state.saving = val;
	},

	setPlanEditInfo(state, info){
		state.planEditInfo = info;
	},

	clearBuildLog(state){
		state.buildLog.splice(0);
	},

	addBuildLogMessage(state, message){
		state.buildLog.push(message);
	},

	[LOAD] (state, models) {
		state.rows.splice(0);
		state.rows.push(...models);
	},

	[ADD] (state, model) {
		let found = find(state.rows, (item) => item._id == model._id);
		if (!found)
			state.rows.push(model);
	},

	[SELECT] (state, row, multiSelect) {
		if (isArray(row)) {
			state.selected.splice(0);
			state.selected.push(...row);
		} else {
			if (multiSelect === true) {
				if (state.selected.indexOf(row) != -1)
					state.selected = state.selected.filter(item => item != row);
				else
					state.selected.push(row);

			} else {
				state.selected.splice(0);
				state.selected.push(row);
			}
		}
	},

	[CLEAR_SELECT] (state) {
		state.selected.splice(0);
	},

	[UPDATE] (state, model) {
		each(state.rows, (item) => {
			if (item._id == model._id)
				assign(item, model);
		});
	},

	[REMOVE] (state, model) {
		state.rows = state.rows.filter(item => item._id != model._id);
	}	
};

import * as getters from "./getters";
import * as actions from "./actions";

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations
};
