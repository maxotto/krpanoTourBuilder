<template>
	<v-layout style="width: 100%; height: 100%">
		<v-container grid-list-md text-xs-center>
			<v-layout row wrap>
				<v-flex xs3>
					<v-btn
						:loading="saving"
						:disabled="!changed || saving"
						color="error"
						@click.native="saveJob()"
					>
						Save job
					</v-btn>
					<p style="color: green"><b>Current scene is {{selected.scene}}</b></p>
					<v-layout row wrap v-for="(hs, index) in selected.hsList" :key="index">
						<v-flex xs4>
							<b>{{hs.name}}</b>
						</v-flex>
						<v-flex xs4
								class="hotspot"
								v-bind:class="{ active: isActiveHotspot(hs.name)}"
						>
							<img
								height="80" width="80"
								:id="hs.name + hs.linkedscene"
								style="background-color: #0c82df"
								:src="getUrlBySceneName(hs.linkedscene)"
								@click="selectHotSpot(hs)"/>
						</v-flex>
						<v-flex xs4>
                            <span style="color: crimson" v-if="scenesData[selected.scene].hotspots[index]">
                                Azimuthal Angle: <br>{{scenesData[selected.scene].hotspots[index].linkedscene_lookat}}
                            </span>
						</v-flex>
					</v-layout>
				</v-flex>
				<v-flex xs9 id="container">
					container
				</v-flex>
			</v-layout>
			<div style="overflow-x: scroll; height: 100%; width: 100%">
				<div v-for="s in scenesData"
					 class="scene"
					 v-bind:class="{ active: isActiveScene(s.name), changed: isChangedScene(s.name)}"
				>
					<div>
						<span><b>{{s.name}}</b></span><br>
						<img
							:id="s.name"
							style="background-color: #0c82df"
							:src="s.url"
							@click="mySelectScene(s.name)"/>
					</div>
				</div>
			</div>
		</v-container>
		<div style="display: none">
			{{scenes}}
		</div>
	</v-layout>
</template>

<script>
	const THREE = require("three");
	const OrbitControls = require("three-orbit-controls")(THREE);
	export default {
		name: "lookAtEditor",
		props: {
			// scenes: Object,
		},
		data: function () {
			return {
				id: undefined,
				changed: false,
				changedList: [],
				selected: {
					scene: "",
					hsList: [],
					hsName: "",
					hsIndex: -1,
					hsLinkedScene: ""
				},
				camera: undefined,
				controls: undefined,
				renderer: undefined,
				scene: undefined,
				scenesData: {},
				hAngle: 0,
				vAngle: 90,
				panoDim: {
					h: 9 * 40,
					w: 16 * 40,
				},
				frames: 0,
			}
		},
		watch: {
			saving(val) {
				if (!val && this.changed) {
					this.changed = false;
				}
			},
			hAngle(angle) {
				this.scenesData[this.selected.scene].hotspots[this.selected.hsIndex].linkedscene_lookat = angle;
			},
			scenes(val) {
				// todo clear initial selected an other states
				this.selected = {
					scene: "",
					hsList: [],
					hsName: "",
					hsIndex: -1,
					hsLinkedScene: ""
				};
				this.changed = false;
				this.changedList = [];
				this.scenesData = {};
				this.clearPano();
				for (let s in val) {
					if (val.hasOwnProperty(s)) {
						this.scenesData[s] = {};
						this.scenesData[s].hotspots = val[s];
						this.scenesData[s].url = this.getUrlBySceneName(s);
						this.scenesData[s].name = s;
					}
				}
			},
		},
		computed: {
			scenes() {
				return this.$store.getters["getScenes"];
			},
			saving() {
				return this.$store.getters["getSaving"];
			},

			error() {
				return this.$store.getters["getError"];
			}
		},
		methods: {
			saveJob() {
				this.$store.dispatch("saveLookAtJob", {id: this.id, scenesData: this.scenesData, dataType: "lookat"});
			},

			isChangedScene: function (scene) {
				return (this.changedList.indexOf(scene) >= 0);
			},
			isActiveScene: function (scene) {
				return (scene === this.selected.scene);
			},
			isActiveHotspot: function (hs) {
				return (hs === this.selected.hsName);
			},
			clearPano: function () {
				const container = document.getElementById("container");
				// make container empty
				while (container.firstChild) container.removeChild(container.firstChild);
				this.frames = 0;
			},
			getHsIndexByName: function (list, name) {
				let out = -1;
				list.forEach((hs, i) => {
					if (hs.name === name) {
						out = i;
					}
				});
				return out;
			},
			getUrlBySceneName: function (s) {
				return `/getimage/${this.id}?scene=` + s.substring(6);
			},
			selectHotSpot: function (hs) {
				this.selected.hsName = hs.name;
				this.selected.hsIndex = this.getHsIndexByName(this.selected.hsList, this.selected.hsName);
				this.selected.hsLinkedScene = hs.linkedscene;
				this.reRunPano(hs.linkedscene);
			},
			mySelectScene: function (s) {
				this.clearPano();
				scroll(0, 0);
				this.selected = {
					scene: "",
					hsList: [],
					hsName: "",
					hsIndex: -1,
					hsLinkedScene: ""
				};
				this.selected.scene = s;
				this.selected.hsList = this.scenesData[this.selected.scene].hotspots;
			},
			getTexturesByScene: function (myScene) {
				var textures = [];
				var names = [
					this.getUrlBySceneName(myScene) + "&vr=r",
					this.getUrlBySceneName(myScene) + "&vr=l",
					this.getUrlBySceneName(myScene) + "&vr=u",
					this.getUrlBySceneName(myScene) + "&vr=d",
					this.getUrlBySceneName(myScene) + "&vr=f",
					this.getUrlBySceneName(myScene) + "&vr=b",
				];
				var imageObj = [];
				for (var i = 0; i < 6; i++) {
					textures[i] = new THREE.Texture();
				}

				names.forEach((name, i) => {
					imageObj[i] = new Image();
					imageObj[i].onload = function () {
						var canvas, context;
						var tileWidth = imageObj[i].height;
						canvas = document.createElement("canvas");
						context = canvas.getContext("2d");
						canvas.height = tileWidth;
						canvas.width = tileWidth;
						context.drawImage(imageObj[i], 0, 0, tileWidth, tileWidth, 0, 0, tileWidth, tileWidth);
						textures[i].image = canvas;
						textures[i].needsUpdate = true;
					};
					imageObj[i].src = names[i];
				});
				return textures;
			},
			onWindowResize: function () {
				this.camera.aspect = this.panoDim.w / this.panoDim.h;
				this.camera.updateProjectionMatrix();
				this.renderer.setSize(this.panoDim.w, this.panoDim.h);
			},

			reRunPano: function (myScene) {
				this.clearPano();
				const s = this.scenes;
				this.renderer = new THREE.WebGLRenderer();
				this.renderer.setPixelRatio(window.devicePixelRatio);
				this.renderer.setSize(this.panoDim.w, this.panoDim.h);
				container.appendChild(this.renderer.domElement);

				this.scene = new THREE.Scene();

				this.camera = new THREE.PerspectiveCamera(90, this.panoDim.w / this.panoDim.h, 0.1, 100);
				this.camera.position.x = 0;
				this.camera.position.y = 0;
				this.camera.position.z = 0;
				this.controls = new OrbitControls(this.camera, this.renderer.domElement);

				this.controls.enableZoom = false;
				this.controls.enablePan = false;
				this.controls.enableDamping = true;
				this.controls.rotateSpeed = -0.25;
				/**
				 *  https://stackoverflow.com/questions/37192936/three-js-orbitcontrols-how-to-change-center

				 You can set the center of rotation for OrbitControls like so:

				 controls = new THREE.OrbitControls( camera, renderer.domElement );
				 controls.target.set( x, y, z );

				 The Vector3 target is the center of rotation, and the point the camera "looks at".
				 */
				const r = 0.001;
				this.hAngle = this.scenesData[this.selected.scene].hotspots[this.selected.hsIndex].linkedscene_lookat;
				const lookAt = (-1) * this.scenesData[this.selected.scene].hotspots[this.selected.hsIndex].linkedscene_lookat * Math.PI / 180;
				const z = Math.cos(lookAt) * r;
				const x = Math.sin(lookAt) * r;
				this.controls.target.set(-x, 0, -z);

				const textures = this.getTexturesByScene(myScene);

				const materials = [];

				for (var i = 0; i < 6; i++) {
					materials.push(new THREE.MeshBasicMaterial({map: textures[i]}));
				}
				const skyBox = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 1), materials);
				skyBox.geometry.scale(1, 1, -1);
				this.scene.add(skyBox);
				this.animate();
			},
			animate: function () {
				++this.frames;
				const newHA = (-1) * Math.floor(this.controls.getAzimuthalAngle() / Math.PI * 180 * 100) / 100;
				const newVA = Math.floor(this.controls.getPolarAngle() / Math.PI * 180 * 100) / 100;
				const delta = Math.abs(this.hAngle - newHA);
				if (delta >= 0.01) {
					this.hAngle = newHA;
					if (this.frames > 10) {
						this.changed = true;
						this.changedList.push(this.selected.scene);
					}
				}
				this.vAngle = newVA;
				requestAnimationFrame(this.animate);
				this.controls.update(); // required when damping is enabled
				this.renderer.render(this.scene, this.camera);
			}
		},
		mounted: function () {
			window.addEventListener("resize", this.onWindowResize, false);
			this.id = this.$route.params.id;
		}
	}
</script>

<style scoped>
	.container {
		padding: unset !important;
	}

	.table-div1:nth-child(n+2) {
		margin-left: -1px;
	}

	.hotspot.active {
		border: 2px solid red;
	}

	.hotspot {
		border: 2px solid grey;
	}

	.scene {
		display: inline-block;
		border: 6px solid grey;
	}

	.scene.active {
		display: inline-block;
		border: 6px solid red;
	}

	.scene.changed.active {
		display: inline-block;
		border: 6px solid #ff860c;
	}

	.scene.changed {
		display: inline-block;
		border: 6px solid #ffc831;
	}
</style>
