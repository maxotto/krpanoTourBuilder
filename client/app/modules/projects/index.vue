<template>
	<div>
		<h1>My krpano projects</h1>
		<v-app class="v-app">
			<v-content>
				<v-container fluid>
					<v-snackbar
						:color="snackbar.color"
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
					<v-btn color="primary" dark class="mb-2" @click="prepareCreate">New project</v-btn>
					<v-dialog v-model="dialog" max-width="1024" >
						<v-card>
							<v-card-title>
								<span class="headline">{{dlgTitle}}</span>
								{{editedItem.state}}
							</v-card-title>

							<v-card-text>
								<div>
									<v-layout row wrap>
										<v-flex xs6>
											<v-layout wrap row>
												<v-flex xs12>
													<v-text-field v-model="editedItem.title" label="Title"></v-text-field>
												</v-flex>
												<v-flex xs12>
													<v-text-field v-model="editedItem.address" label="Address"></v-text-field>
												</v-flex>
												<v-flex xs12>
													<v-select
														:items="templatesList"
														label="Select template to generate"
														v-model="editedItem.template"
													></v-select>
												</v-flex>
												<v-flex xs6>
													<v-checkbox
														:label="`Show map button`"
														v-model="editedItem.showMap"
													></v-checkbox>
												</v-flex>
												<v-flex xs6>
													<v-checkbox
														:label="`Use custom map`"
														v-model="editedItem.useCustomMap"
													></v-checkbox>
												</v-flex>
												<v-flex xs12>
													<v-text-field v-model="editedItem.loadingtext" label="Loading text"></v-text-field>
												</v-flex>
												<v-flex xs12>
													{{editedItem.location}}
												</v-flex>
											</v-layout>
										</v-flex>
										<v-flex xs6>
											<div style="width: 510px; height: 510px; padding: 15px">
												<GmapMap :center="editedItem.location" :zoom="14" style="width: 480px; height: 480px">
													<GmapMarker
														:position="markerLocation"
														:clickable="true"
														:draggable="true"
														@dragend="dragEnd"
														@drag="updateCoordinates"
													></GmapMarker>
												</GmapMap>
											</div>
										</v-flex>
									</v-layout>

								</div>
							</v-card-text>
							<v-card-actions>
								<v-spacer></v-spacer>
								<v-btn color="blue darken-1" flat @click.native="dlgCancel">Cancel</v-btn>
								<v-btn color="blue darken-1" :disabled="!canSaveNew" flat @click.native="dlgSave">Save</v-btn>
							</v-card-actions>
						</v-card>
					</v-dialog>
					<v-data-table
						:headers="headers"
						:items="projects"
						hide-actions
						class="elevation-1"
					>
						<template slot="items" slot-scope="props">
							<tr>
								<td class="text-xs-center">{{ props.item.title }}</td>
								<td class="text-xs-center">{{ props.item.address }}</td>
								<td class="text-xs-center">{{ props.item.template }}</td>
								<td class="justify-center layout px-0">
									<action-buttons
										:state="props.item.state"
										:id="props.item._id"
										@unzipped="unzipped"
									></action-buttons>
									<v-icon
										small
										class="mr-2"
										@click="editItem(props.item)"
									>
										edit
									</v-icon>
									<v-icon
										small
										@click="deleteItem(props.item)"
									>
										delete
									</v-icon>

								</td>
							</tr>
						</template>
					</v-data-table>
					<v-btn color="success">Success</v-btn>
					<v-btn color="error">Error</v-btn>
					<v-btn color="warning">Warning</v-btn>
					<v-btn color="info">Info</v-btn>
				</v-container>
			</v-content>

		</v-app>
	</div>
</template>

<script>
	import ActionButtons from "./components/actionButtons.vue";
	import { mapGetters, mapActions } from "vuex";
	import schema from "./schema";

	export default {
		data() {
			return {
				uploader: undefined,
				options: {
					chunkSize: 52428800*10,
					target: this.getTarget,
					testChunks: false
				},
				attrs: {
					accept: 'application/zip'
				},
				headers: [
					{
						text: "Title",
						value: "title",
						align: "center"
					},
					{ text: "Address", value: "address", align: "center" },
					{ text: "Template", value: "template", align: "center" },
					{ text: "Actions", value: "_id", sortable: false, align: "center"},
				],
				dialog: false,
				dlgTitle: "",
				editedIndex: -1,
				editedItem: {
					id: null,
					title: "",
					address: "",
					template: "First",
					showMap: true,
					useCustomMap: true,
					language: "en",
					loadingtext: "",
					googleMapUnits: "imperial",
					useFixedZoom: true,
					iniZoom: 17,
					location: {
						lat: 43.6567919,
						lng: -79.6010328,
					},
					state: {},
					tour: "{}"
				},
				newItem: {
					id: null,
					title: "",
					address: "",
					template: "First",
					showMap: true,
					useCustomMap: true,
					language: "en",
					loadingtext: "",
					googleMapUnits: "imperial",
					useFixedZoom: true,
					iniZoom: 17,
					location: {
						lat: 43.6567919,
						lng: -79.6010328,
					},
					state: {},
					tour: "{}"
				},
				template: "First",
				templatesList: [
					"First"
				],
				markerLocation: {
					lat: 43.6567919,
					lng: -79.6010328,
				},
				snackbar: {
					visible: false,
					color: "error",
					y: "bottom",
					x: null,
					mode: "multi-line",
					timeout: 6000,
					text: "Hello, I\"m a snackbar"
				},
				lastError: "",
			};
		},

		name: "index",
		components: {
			ActionButtons
		},

		computed: {
			...mapGetters("projects", [
				"projects",
				"selected",
				"errors",
				"success"
			]),
			canSaveNew(){
				return (
					this.editedItem.title !== "" &&
					this.editedItem.address !== "" &&
					this.editedItem.folder !== "./" &&
					this.editedItem.outFolder !== "./" &&
					// this.editedItem.outFolder !== this.editedItem.folder &&
					this.editedItem.location.lat !== 43.6567919 &&
					this.editedItem.location.lng !== -79.6010328
				);
			}
		},
		watch: {
			success(val){
				if(this.dialog && val){
					this.dialog = false;
					this.resetDlg();
				}
			},
			errors(val){
				if(this.dialog && Object.keys(val).length){
					this.snackbar.text = JSON.stringify(val);
					this.lastError = JSON.stringify(val);
					this.snackbar.visible = true;
					this.dialog = false;
					this.resetDlg();
				}
			}
		},
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
			]),
			saveProject(data){
				this.updateRow({
					title: data.title,
					address: data.address,
					folder: data.folder,
					outFolder: data.outFolder,
					template: data.template,
					location: data.location,
					id: data._id,
					showMap: data.showMap,
					useCustomMap: data.useCustomMap,
					language: data.language,
					loadingtext: data.loadingtext,
					googleMapUnits: data.googleMapUnits,
					useFixedZoom: data.useFixedZoom,
					iniZoom: data.iniZoom,
					state: data.state,
					tour: data.tour,
				});
			},
			createProject (data) {
				this.created({
					title: data.title,
					address: data.address,
					template: data.template,
					location: data.location,
					showMap: data.showMap,
					useCustomMap: data.useCustomMap,
					language: data.language,
					loadingtext: data.loadingtext,
					googleMapUnits: data.googleMapUnits,
					useFixedZoom: data.useFixedZoom,
					iniZoom: data.iniZoom,
					state: {
						uploaded: false,
						floors: false,
						floorsImages: false,
						hotspots: false,
						lookatTag: false,
						needRebuild: false,
						built: false,
						lookatValue: false,
						planHotspots: false,
					},
					tour: "{}"
				}, true);
				/*
					.then(result => {
						if (!result.data.success){
							this.snackbar.text = result.data.message;
							this.lastError = result.data.message;
							this.snackbar.visible = true;
						} else {
							this.getList();
							this.dialog = false;
							this.resetDlg();
						}
					})
					.catch(error => {console.log(error)});
					*/
			},
			dlgCancel(){
				this.dialog = false;
				this.resetDlg();
			},

			dlgSave(){
				if(this.editedItem._id){
					this.saveProject(this.editedItem);
				} else {
					this.createProject(this.editedItem);
				}
			},

			resetDlg(){
				this.lastError = "";
				this.editedItem = Object.assign({}, this.newItem);
				this.markerLocation = this.newItem.location;
				this.editedIndex = -1;
			},

			unzipped(res){
				console.log(res);
				return;
				const responce = JSON.parse(res);
				// todo alnalyze response and do different things
				console.log({responce});
				if(responce.success){
					this.snackbar.text = "File uploaded and unzipped!";
					this.snackbar.visible = true;
					this.getList();
				}
			},
			prepareCreate(){
				this.editedItem = Object.assign({}, this.newItem);
				this.markerLocation = this.newItem.location;
				this.dlgTitle = "Create new project";
				this.dialog = true;
			},
			dragEnd(e){
				this.editedItem.location = this.markerLocation;
			},
			updateCoordinates(location) {
				this.markerLocation = {
					lat: location.latLng.lat(),
					lng: location.latLng.lng(),
				};
			},
			editItem (item) {
				this.resetDlg();
				this.editedIndex = this.projects.indexOf(item);
				this.editedItem = Object.assign({}, item);
				this.options.target = '/upload/project/'+this.editedItem._id;
				this.markerLocation = this.editedItem.location;
				this.dlgTitle = 'Edit the project';
				this.dialog = true;
			},

			deleteItem (item) {
				confirm('Are you sure you want to delete this project "' + item.title + '"?') && this.removeRow(item);
			},
		},

		created() {
			// Download rows for the page
			this.downloadRows();
		}
	};
</script>

<style scoped>
.v-app {
	background-color: transparent;
}
</style>
