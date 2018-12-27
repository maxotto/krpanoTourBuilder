<template>
	<div>
		<v-snackbar
			v-model="snackbar.visible"
			:bottom="snackbar.y === 'bottom'"
			:left="snackbar.x === 'left'"
			:multi-line="snackbar.mode === 'multi-line'"
			:right="snackbar.x === 'right'"
			:timeout="snackbar.timeout"
			:top="snackbar.y === 'top'"
			:vertical="snackbar.mode === 'vertical'"
		>
			{{ snackbar.text }}
			<v-btn
				color="pink"
				flat
				@click="snackbar.snackbar = false"
			>
				Close
			</v-btn>
		</v-snackbar>
		<h1>Initiate project</h1>
		<p v-if="project">{{project.floorSelect}}</p>
		<span style="color: red;"><b> {{lastError}}</b></span><br>
		<v-stepper v-model="step" vertical v-if="project">
			<v-stepper-step :complete="step > 1" step="1">
				<h3>Select number of floors</h3>
				and upload appropriate maps` images<br>
			</v-stepper-step>

			<v-stepper-content step="1">
				<v-card color="grey lighten-1" class="mb-5">
					<v-flex xs12 style="margin: 15px;">
						<div class="floorSelectorContainer">
							<v-layout row wrap v-for="(template, i) in floorsTemplate" :key="`${i}`"
									  class="floorSelector" align-content-center>
								<v-flex xs3 align-content-center>
									<v-switch
										:label="`${template.name}`"
										v-model="template.state"
									></v-switch>
								</v-flex>
								<v-flex xs2 align-content-center>
									<img :src="`resource/projects/${id}/getimage/fromtemplate/floorselector/?n=${i}&t=up`"/>
								</v-flex>
								<v-flex xs4 align-content-center>
									<upload-block :template="template" :recordId="id" @clicked="uploaded"
												  :forceUpload="template.state"></upload-block>
								</v-flex>
								<v-flex xs3 align-content-center>
									<v-img
										:id="`floormap${i}`"
										class="floormap"
										:src="`${template.image}`"
										max-height="64"
										aspect-ratio="1"
										contain
									/>
								</v-flex>
							</v-layout>
						</div>
					</v-flex>
				</v-card>
				<v-btn color="primary" @click="step = 2" :disabled="!checkStep1 || !tour">Continue</v-btn>
			</v-stepper-content>

			<v-stepper-step :complete="step > 2" step="2">
				<h3>Set floor for each scene.</h3>
				Mark scenes to put them on the floor"s map
			</v-stepper-step>

			<v-stepper-content step="2">
				<v-btn @click="step = 1" dark color="blue">
					<v-icon>
						mdi-skip-backward
					</v-icon>
					Back to floor definitions
				</v-btn>
				<v-container grid-list-md text-xs-center v-if="tour && scenesData.length > 0">
					<v-layout row wrap v-for="(scene, i) in tour.scene" :key="`${i}`">
						<v-flex xs2>
							<v-img
								:id="`scene-pic-${i}`"
								class="scene-pic"
								:src="`resource/projects/${id}/fromtour/scene/thumb?scene=${scene['$'].name}`"
								max-height="120"
								aspect-ratio="1"
								contain
							/>
						</v-flex>
						<v-flex xs3>
							<p>{{scene['$'].name}}</p>
						</v-flex>
						<v-flex xs3>
							<v-checkbox
								:label="`Hotspot on the map`"
								v-model="scenesData[i].hotspot"
								@change="step2Changed=true"
							></v-checkbox>
						</v-flex>
						<v-flex xs3>
							<v-select
								:items="floorSelect"
								item-text="label"
								item-value="value"
								v-model="scenesData[i].floor"
								box
								label="Select floor"
								@change="step2Changed=true"
							></v-select>
						</v-flex>
						<v-flex xs1>
							<v-icon v-if="scenesData[i].floor >= 0" color="green" large>
								mdi-check-all
							</v-icon>
							<v-icon v-else color="red" large>
								mdi-alert-circle
							</v-icon>
						</v-flex>
					</v-layout>
				</v-container>
				<v-btn @click="step = 1" dark color="blue">
					<v-icon>
						mdi-skip-backward
					</v-icon>
					Back to floor definitions
				</v-btn>
				<v-btn color="green" :disabled="!step2Changed" @click="saveTour">
					<v-icon>
						mdi-content-save-all
					</v-icon>
					Save job
				</v-btn>
				<v-btn color="primary" @click="step = 3" :disabled="!checkStep2">Continue</v-btn>
			</v-stepper-content>

			<v-stepper-step :complete="step > 3" step="3">Select an ad format and name ad unit</v-stepper-step>

			<v-stepper-content step="3">
				<v-card color="grey lighten-1" class="mb-5" height="200px"></v-card>
				<v-btn color="primary" @click="step = 4">Continue</v-btn>
				<v-btn flat>Cancel</v-btn>
			</v-stepper-content>

			<v-stepper-step step="4">View setup instructions</v-stepper-step>
			<v-stepper-content step="4">
				<v-card color="grey lighten-1" class="mb-5" height="200px"></v-card>
				<v-btn color="primary" @click="step = 1">Continue</v-btn>
				<v-btn flat>Cancel</v-btn>
			</v-stepper-content>
		</v-stepper>
	</div>
</template>

<script>
	// import ProjectsService from "@/services/ProjectsService";
	import UploadBlock from "./uploadBlock";
	import { mapGetters, mapActions } from "vuex";

	export default {
		name: "initiateProject",
		components: {UploadBlock},
		props: ["id"],
		data() {
			return {
				step2Changed: false,
				ready: false,
				step: 1,
				scenesData: [],
				FormData: undefined,
				floorsCount: 0,
				floors: [],
				floorSelect: [{
					value: -1,
					label: "Not set"
				}],
				emptyImage: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
				floorsTemplate: [
					{
						number: 0,
						name: "Basement",
						state: false,
						files: [],
						image: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
						uploaded: false,
					},
					{
						number: 1,
						name: "First floor",
						state: false,
						files: [],
						image: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
						uploaded: false,
					},
					{
						number: 2,
						name: "Second floor",
						state: false,
						files: [],
						image: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
						uploaded: false,
					},
					{
						number: 3,
						name: "Third floor",
						state: false,
						files: [],
						image: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
						uploaded: false,
					},
				],
				tour: undefined,
				project: null,
				snackbar: {
					visible: false,
					y: "top",
					x: null,
					mode: "multi-line",
					timeout: 6000,
					text: "Hello, I\"m a snackbar"
				},
				lastError: "",
				checkStep1: false,
				checkStep2: false,
			};
		},
		computed: {
			...mapGetters("projects", [
				"projects",
				"selected",
				"errors",
				"success"
			]),
		},
		methods: {
			setProject(project){
				this.project = project;
				this.tour = JSON.parse(this.project.tour);
				this.updateFloorMaps();
			},
			saveTour() {
				this.step2Changed = false;
				this.updateScenes();
				this.project.tour = JSON.stringify(this.tour);
				this.saveProject();
			},
			updateScenes() {
				this.scenesData.forEach((scene, i) => {
					this.tour.scene[i]['$'].floor = scene.floor.toString();
					this.tour.scene[i]['$'].hotspot = (scene.hotspot) ? "true" : "false";
				});
			},
			updateScenesFloors() {
				this.scenesData.forEach((scene, i) => {
					const found = this.floorSelect.findIndex((fs) => {
						return fs.value == scene.floor;
					});
					if (found === -1) {
						this.scenesData[i].floor = "-1";
					} else {
						this.scenesData[i].floor = this.floorSelect[found].value;
					}
				});
			},
			checkSteps() {
				this.checkStep(1);
			},
			checkStep(step) {
				console.log("Step check", step);
				if (step === 1) {
					let ready = true;
					let hasOne = false;
					this.floorsTemplate.forEach(floor => {
						if (floor.state) {
							ready = ready && floor.uploaded;
						}
						if (!hasOne) {
							hasOne = floor.state && floor.uploaded;
						}
					});
					this.checkStep1 = ready && hasOne;
					console.log("this.checkStep1=", this.checkStep1);
				}
			},
			uploaded(data) {
				// console.log("Uploaded", data);
				const floor = data.floor;
				const mapFile = data.file;
				if(data.success === true && data.project){
					this.setProject(data.project);
				}
				//this.getProject();
			},
			saveProject() {
				/*
				ProjectsService.updateProject({
					title: this.project.title,
					address: this.project.address,
					folder: this.project.folder,
					outFolder: this.project.outFolder,
					template: this.project.template,
					location: this.project.location,
					id: this.project._id,
					state: this.project.state,
					tour: this.project.tour,
				})
					.then(result => {
						if (!result.data.success) {
							this.snackbar.text = result.data.message;
							this.lastError = result.data.message;
							this.snackbar.visible = true;
						} else {
							this.getProject();
						}
					})
					.catch(err => {
						console.log(err)
					});
				*/
			},
			getProject() {
				const i = this.projects.findIndex(p => {
					return (p._id === this.id);
				});
				this.setProject(this.projects[i]);
				this.composeScenesForEditor();
			},
			updateFloorMaps() {
				this.floorSelect = [{
					value: "-1",
					label: "Not set"
				}];
				this.floorsTemplate.forEach((floor, i) => {
					const index = this.project.floorSelect.findIndex(elem => {
						return (floor.number == elem.floor);
					});
					if (index >= 0) {
						this.floorsTemplate[i].image = this.emptyImage;
						this.floorsTemplate[i].state = true;
						this.floorsTemplate[i].uploaded = true;
						this.floorSelect.push(
							{
								value: this.floorsTemplate[i].number.toString(),
								label: this.floorsTemplate[i].name,
							}
						);
						const image = this.project.floorSelect[index].image;
						setTimeout(() => {
							// this.floorsTemplate[i].image = `getimage/floormap/${this.id}/${i}?rnd` + +Math.random();
							this.floorsTemplate[i].image = `resource/projects/${this.id}/getimage/floormap?floor=${i}&rnd=` + Math.random();
						}, 100);
					} else {
						// console.log("Clear state", this.floorsTemplate);
						this.floorsTemplate[i].image = this.emptyImage;
						this.floorsTemplate[i].state = false;
						this.floorsTemplate[i].uploaded = false;
						this.floorsTemplate[i].files = [];
					}
				});
				this.updateScenesFloors();
				this.checkSteps();
				setTimeout(() => {
					this.ready = true;
				}, 100);
			},
			getFloorSelectorPicNames(number) {
				return {
					up: number + "FloorUp.jpg",
					down: number + "FloorDown.jpg",
				};
			},
			detectStateChange(val) {
				this.checkSteps();
				let changes = [];
				val.forEach((newFloor, i) => { // if there are uploaded image but we set inactive state
					if (!newFloor.state && newFloor.image !== this.emptyImage) {
						changes.push(i);
					}
				});
				changes.forEach(change => {
					this.axios.delete(`api/projects/${this.id}/delete/floorImage?floor=${this.floorsTemplate[change].number}`)
						.then(res => {
							const data = res.data.data;
							if (data.success === true && data.project) {
								this.setProject(data.project);
							} else {
								console.log(res);
							}
						})
						.catch(err => {
							console.log(err);
						});
				});
			},
			composeScenesForEditor() {
				if (this.tour) {
					this.scenesData = [];
					console.log("this.tour=",this.tour);
					this.tour.scene.forEach((scene, index) => {
						this.scenesData.push(
							{
								name: scene['$'].name,
								hotspot: scene['$'].hotspot ? (scene['$'].hotspot === "true") : false,
								floor: scene['$'].floor ? (scene['$'].floor) : null,
							}
						);
					});
					this.updateScenesFloors();
				}
			},
		},
		watch: {
			id(val) {
				this.getProject();
			},
			floorsTemplate: {
				handler: function (val) {
					if (this.ready) {
						this.detectStateChange(val);
						// console.log("Deep watcher",val);
						this.composeScenesForEditor();
					}
				},
				deep: true
			}
		},

		mounted() {
			this.id = this.$route.params.id;
			this.getProject();
		},
	};
</script>

<style scoped>
	.container {
		padding: unset;
		margin: unset;
	}

	.floorSelector {
		min-height: 85px;
	}

	.floorSelectorContainer {
		max-width: 600px;
		width: 600px;
	}
</style>
