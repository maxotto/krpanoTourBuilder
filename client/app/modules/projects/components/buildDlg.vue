<template>
	<v-dialog
		v-model="show"
		max-width="650"
		persistent
	>
		<v-card>
			<v-card-title class="headline">Build Project</v-card-title>
			<div class="log" id="log">
				<template v-for="row in logTxt">{{row}}<br></template>
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

	export default {
		name: "buildDlg",
		props: ["id", "show"],
		data() {
			return {
				logTxt: [],
				logDiv: undefined,
				inProcess: false,
				success: false,
			};
		},
		methods: {
			closeDlg() {
				this.logTxt = [];
				this.$emit("closeDlg", this.success);
			},
			startBuild: function () {
				this.logTxt = [];
				this.inProcess = true;
				this.success = false;
				ProjectsService.buildProject(this.id)
					.then(res => {
						if (res.data.success) {
							this.success = true;
							alert("Project is built!");
							this.$store.commit("setNeedToReloadCurrent", true);
						} else {
							this.logTxt.push(JSON.stringify(res.data.message));
							setTimeout(() => {
								alert("There was an error during build!");
							}, 100);
							console.log(res.data.message);
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
		mounted() {
			this.logDiv = document.getElementById("log");
			this.$socket.on("build", (data) => {
				this.logTxt.push(data.message);
				Promise.resolve().then(() => {
					this.logDiv.scrollTop = this.logDiv.scrollHeight - this.logDiv.clientHeight;
				});

			});
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
