<template>
	<v-dialog
		v-model="show"
		max-width="650"
		persistent
	>
		<v-card>
			<v-card-title class="headline">Build Project</v-card-title>
			<div class="log" id="log">
				<template v-for="row in buildLog">{{row}}<br></template>
			</div>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn small color="success" @click="startBuild" :disabled="inProcess">Start build</v-btn>
				<v-btn
					color="green darken-1"
					flat="flat"
					:disabled="inProcess"
					@click="closeDlg()"
				>
					Close
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
	import ProjectsService from "../store/ProjectsService";
	import { mapGetters, mapActions } from "vuex";

	export default {
		name: "buildDlg",
		props: ["id", "show"],
		data() {
			return {
				logDiv: undefined,
				inProcess: false,
				success: false,
			};
		},
		methods: {
			...mapActions("projects", [
				"clearBuildLog",
				"addBuildLogMessage",
				"updated",
			]),
			closeDlg() {
				this.clearBuildLog();
				this.$emit("closeDlg", this.success);
			},
			startBuild: function () {
				this.clearBuildLog();
				this.inProcess = true;
				this.success = false;
				ProjectsService.buildProject(this.id)
					.then(res => {
						const data = res.data.data;
						if (data.success) {
							this.success = true;
							// alert("Project is built!");
							this.updated(data.project);
						} else {
							this.logTxt.push(JSON.stringify(data.message));
							setTimeout(() => {
								alert("There was an error during build!");
							}, 100);
							console.log(data.message);
						}
						this.inProcess = false;
						this.logDiv.scrollTop = this.logDiv.scrollHeight - this.logDiv.clientHeight;
					})
					.catch(err => {
						// this.logDiv.scrollTop = this.logDiv.scrollHeight - this.logDiv.clientHeight;
						this.inProcess = false;
						console.log(err);
					});
			},
		},
		computed: {
			...mapGetters("projects", [
				"buildLog"
			]),
		},
		watch:{
			buildLog: {
				handler: function(val, oldVal){
					this.logDiv.scrollTop = this.logDiv.scrollHeight;
				},
				deep: true,
			},
		},
		mounted() {
			this.logDiv = document.getElementById("log");
			this.logDiv.scrollTop = this.logDiv.scrollHeight - this.logDiv.clientHeight;
		},
	};
</script>

<style scoped>
	.log {
		margin: 0 auto;
		width: 95%;
		max-height: 350px;
		height: 350px;
		border-style: solid;
		border-width: 2px;
		border-color: #b7b7b7;
		background-color: #e0e0e0;
		overflow-y: auto;
	}
</style>
