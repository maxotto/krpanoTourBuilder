import Vue from "vue";
import moment from "moment";
// import { deviceTypes } from "./types";
import { validators } from "vue-form-generator";

import { find } from "lodash";

let _ = Vue.prototype._;

module.exports = {

	id: "projects",
	title: _("My_projects"),

	table: {
		multiSelect: true,
		columns: [
			{
				title: _("Address"),
				field: "address"
			},
		],

		rowClasses: function(model) {
			return {
				inactive: !model.user
			};
		}

	},

	form: {
		fields: [
			{
				type: "input",
				label: _("Address"),
				model: "address",
				placeholder: _("AddressOfDevice"),
				validator: validators.string
			},
		]
	},

	options: {
		searchable: true,


		enableNewButton: true,
		enabledSaveButton: true,
		enableDeleteButton: true,
		enableCloneButton: false,

		validateAfterLoad: false, // Validate after load a model
		validateAfterChanged: false, // Validate after every changes on the model
		validateBeforeSave: true // Validate before save a model
	},

	events: {
		onSelect: null,
		onNewItem: null,
		onCloneItem: null,
		onSaveItem: null,
		onDeleteItem: null,
		onChangeItem: null,
		onValidated(model, errors, schema) {
			if (errors.length > 0)
				console.warn("Validation error in page! Errors:", errors, ", Model:", model);
		}
	},

	resources: {
		addCaption: _("AddNewDevice"),
		saveCaption: _("Save"),
		cloneCaption: _("Clone"),
		deleteCaption: _("Delete")
	}

};
