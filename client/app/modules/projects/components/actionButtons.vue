<template>
	<div>
		<v-dialog
			v-model="dialog"
			width="500"
		>
			<v-card>
				<v-card-title
					class="headline grey lighten-2"
					primary-title
				>
					Upload project zip
				</v-card-title>

				<v-card-text>
					<uploader
						ref="uploader"
						:options="options"
						class="uploader-example"
						@complete=""
						@file-success="fileSuccess"
						@file-error="fileError"
					>
						<uploader-unsupport></uploader-unsupport>
						<uploader-drop>
							<p>Drop files here to upload or</p>
							<uploader-btn :attrs="attrs">select files</uploader-btn>
						</uploader-drop>
						<uploader-list></uploader-list>
					</uploader>
				</v-card-text>

				<v-divider></v-divider>

				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn
						color="primary"
						flat
						@click="dialog = false"
					>
						I accept
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<v-btn
			color="success"
			small
			:disabled="!upload"
			@click="dialog = true"
		>
			Upload
		</v-btn>
		<v-btn small color="success" :disabled="!ini" :to="iniURL">Initiate</v-btn>
		<!--- <v-btn small color="success" :disabled="!build" :to="buildURL">Build</v-btn> --->
		<v-btn
			small
			color="success"
			:disabled="!build"
			@click="$store.commit('setCurrentId', id); buildDlgShow=true"
		>
			Build
		</v-btn>
		<v-btn small color="success" :disabled="!plan" :to="planEditorURL">Set plan&lookat</v-btn>
		<build-dlg :id="id" :show="buildDlgShow" @closeDlg="closeBuildDlg"></build-dlg>
		<div style="display: none">{{currentState}} Need to recalculate when state changed</div>
	</div>
</template>

<script>
	import BuildDlg from "./buildDlg.vue";

	export default {
		components: {BuildDlg},
		name: "actionButtons",
		props: ["state", "id"],
		data() {
			return {
				buildDlgShow: false,
				dialog: false,
				upload: true,
				ini: false,
				build: false,
				plan: false,
				lookat: false,
				iniURL: "",
				buildURL: "",
				planEditorURL: "",
				options: {
					chunkSize: 1024*1024,
					target: this.getTarget,
					testChunks: false,
					generateUniqueIdentifier: this.generateUniqueIdentifier,
				},
				attrs: {
					accept: "application/zip"
				},
			};
		},
		methods: {
			generateUniqueIdentifier(file) {
				let relativePath = file.relativePath || file.webkitRelativePath || file.fileName || file.name;
				return this.id + '-' + file.size + '-' + relativePath.replace(/[^0-9a-zA-Z_-]/img, '');
			},
			closeBuildDlg(success) {
				this.buildDlgShow = false;
				this.setAllowByState(this.state);
			},
			getTarget() {
				return "api/projects/" + this.id + "/upload/";
			},
			fileSuccess(rootFile, file, message, chunk) {
				const response = JSON.parse(message);
				// console.log({response});
				this.dialog = false;
				if(response.status && response.status === 200 && response.data.success){
					this.$emit("unzipped", {
						error: false,
						project: response.data.project,
					});
				} else if(response.data.error && response.data.success === false) {
					this.$emit("unzipped", {error: response.data.error});
				}
			},
			fileError(rootFile, file, message, chunk) {
				console.log(chunk.xhr.status);
				this.$emit("unzipped", {
					error: true,
					status: chunk.xhr.status,
					statusText: chunk.xhr.statusText,
					message: message,
				});
			},
			setPlanEditor() {
				this.planEditorURL = "/project/" + this.id;
			},
			setiniURL() {
				this.iniURL = "/projects/ini/" + this.id;
			},
			setBuildURL() {
				this.buildURL = "/projects/build/" + this.id;
			},
			setAllowByState(state) {
				this.upload = !state.uploaded;
				this.ini = state.uploaded && !state.built;
				this.build =
					state.floors &&
					state.floorsImages &&
					state.hotspots;

				this.lookat =
					state.lookatTag;

				this.plan = state.built && !state.needRebuild;
				this.plan = state.built && !state.needRebuild;
			}
		},
		computed: {
			currentState: {
				get() {
					// console.log("State change", this.state);
					this.setAllowByState(this.state);
					return this.state;
				},
			}
		},
		wathch: {
			id(val) {
				this.setiniURL();
				this.setBuildURL();
				this.setPlanEditor();
				this.setAllowByState(this.state);
				this.options.target = this.getTarget();
			},
			currentState: {
				handler: function (newValue) {
					// this.setAllowByState(newValue);
					console.log("New state: ", newValue);
				},
				deep: true
			}
		},
		mounted() {
			this.setiniURL();
			this.setBuildURL();
			this.setPlanEditor();
			this.setAllowByState(this.state);
		},
	};
</script>

<style scoped>

</style>
