<template>
	<div>
		<h1>PROJECTS</h1>

		<admin-page :schema="schema" :selected="selected" :rows="projects"></admin-page>
	</div>
</template>

<script>
	import AdminPage from "../../core/DefaultAdminPage.vue";
	import { mapGetters, mapActions } from "vuex";
	import schema from "./schema";

	export default {
		data() {
			return {
				schema
			};
		},

		name: "index",
		components: {
			AdminPage: AdminPage
		},

		computed: mapGetters("projects", [
			"projects",
			"selected"
		]),

		methods: {
			...mapActions("projects", [
				"downloadRows",
				"created",
				"updated",
				"removed",
				"selectRow",
				"clearSelection",
				"saveRow",
				"updateRow",
				"removeRow"
			])
		},

		created() {
			// Download rows for the page
			this.downloadRows();
		}
	};
</script>

<style scoped>

</style>
