<template>
	<v-app  class="v-app" style="width: 100%; height: 100%">
		<v-container grid-list-md text-xs-center fluid>
			<v-layout row wrap>
				<v-flex xs2>
					<div>
						<p>Saving: {{saving}}</p>
						<p>X: {{x}}, Y: {{y}}</p>
						<p>Radar angle: {{angle}}</p>
						<v-btn
							:loading="saving"
							:disabled="!changed || saving"
							color="error"
							@click.native="saveJob()"
						>
							Save job
						</v-btn>
						<p>{{error}}</p>
						<img style="border:6px solid green; background-color: #0c82df" id="scene-img" src=""/>

					</div>
				</v-flex>
				<v-flex xs10>
					<div>
						<canvas class="image-input__canvas"
								style="border:6px solid green; background-color: #0c82df"
								ref="canvas"
								v-bind:height="height"
								v-bind:width="width"
								v-bind:class="{ 'is-draggable': hoverIsDraggable }">
						</canvas>
					</div>
				</v-flex>
			</v-layout>
		</v-container>
	</v-app>
</template>

<script>
	// todo delete hotspots ??
	import { mapGetters, mapActions } from "vuex";
	export default {
		name: "planEditor",
		props: {
			floor: Object,
			xmlData: Object,
		},
		data: function () {
			return {
				id: "",
				hoverIsDraggable: false,
				width: 100,
				height: 100,
				ctx: null,
				canvas: null,
				img: null,
				hotspots: [],
				radars: [],
				x: 0,
				y: 0,
				currentHS: -1,
				currentScene: {
					img: undefined,
				},
				hotspotImg: undefined,
				hotspotDim: {
					w: 10,
					h: 10
				},
				interval: 30,
				mouse: {x: 0, y: 0},
				gragging: false,
				dragoffx: 0,
				dragoffy: 0,
				dragRadar: false,
				dragRadarX: 0,
				dragRadarY: 0,
				dragRadarStartAngleDiff: 0,

				radarRadius: 150,
				radarWidth: 90,  //degree
				angle: 0,
				valid: false,
				frames: 0,
				changed: false,
			};
		},
		computed: {
			...mapGetters("projects", [
				"saving"
			]),
			error() {
				return this.$store.getters["getError"];
			}
		},
		methods: {
			...mapActions("projects", [
				"saveFloorJob"
			]),
			saveJob() {
				this.saveFloorJob({id: this.id, floor: this.floor, hotspots: this.hotspots});
				// this.$store.dispatch("saveFloorJob", {id: this.id, floor: this.floor, hotspots: this.hotspots});

			},
			updateHotSpots: function (floor) {
				this.hotspots = [...this.xmlData[floor]["hotspots"]];
			},
			onMouseDown: function (e) {
				const mouse = this.getMousePos(e);
				this.mouse = mouse;
				const mx = mouse.x;
				const my = mouse.y;
				for (let i = this.hotspots.length - 1; i >= 0; i--) {
					let hs = this.hotspots[i];
					if (
						(mx >= hs.x) &&
						(mx <= (parseInt(hs.x) + this.hotspotDim.w)) &&
						(my >= hs.y) && (my <= (parseInt(hs.y) + this.hotspotDim.h))
					) {
						this.currentHS = i;
						this.x = this.hotspots[this.currentHS].x;
						this.y = this.hotspots[this.currentHS].y;
						this.x = this.hotspots[this.currentHS].x;
						this.angle = this.hotspots[this.currentHS].parent.angle;
						this.dragoffx = mx - hs.x;
						this.dragoffy = my - hs.y;
						this.dragging = true;
						this.valid = false;
						return;
					}
				}
				if (this.currentHS >= 0) {
					this.drawRadar();
					if (this.ctx.isPointInPath(mx, my)) {
						this.dragRadar = true;
						this.dragRadarX = mx;
						this.dragRadarY = my;
						const rg = this.getRadarGeometry();
						const dX = mouse.x - rg.x;
						const dY = mouse.y - rg.y;
						this.dragRadarStartAngleDiff = Math.atan2(dY, dX) / Math.PI * 180 - this.hotspots[this.currentHS].parent.angle;
						this.valid = false;
					} else {
						this.currentHS = -1;
						this.valid = false;
					}
				}
			},
			getMousePos: function (e) {
				let element = this.canvas;
				let offsetX = 0;
				let offsetY = 0;
				let mx;
				let my;

				if (element.offsetParent !== undefined) {
					do {
						offsetX += element.offsetLeft;
						offsetY += element.offsetTop;
					} while ((element = element.offsetParent));
				}
				const html = document.body.parentNode;
				const htmlTop = html.offsetTop;
				const htmlLeft = html.offsetLeft;
				let stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
				if (document.defaultView && document.defaultView.getComputedStyle) {
					stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(this.canvas, null)["paddingLeft"], 10) || 0;
					stylePaddingTop = parseInt(document.defaultView.getComputedStyle(this.canvas, null)["paddingTop"], 10) || 0;
					styleBorderLeft = parseInt(document.defaultView.getComputedStyle(this.canvas, null)["borderLeftWidth"], 10) || 0;
					styleBorderTop = parseInt(document.defaultView.getComputedStyle(this.canvas, null)["borderTopWidth"], 10) || 0;
				}
				// Add padding and border style widths to offset
				// Also add the <html> offsets in case there"s a position:fixed bar
				offsetX += stylePaddingLeft + styleBorderLeft + htmlLeft;
				offsetY += stylePaddingTop + styleBorderTop + htmlTop;

				mx = e.pageX - offsetX;
				my = e.pageY - offsetY;

				// We return a simple javascript object (a hash) with x and y defined
				return {x: mx, y: my};

			},
			onMouseMove: function (e) {
				const mouse = this.getMousePos(e);
				if (this.dragging) {
					this.changed = true;
					this.hotspots[this.currentHS].x = mouse.x - this.dragoffx;
					this.hotspots[this.currentHS].y = mouse.y - this.dragoffy;
					this.x = this.hotspots[this.currentHS].x;
					this.y = this.hotspots[this.currentHS].y;
					this.valid = false; // Something"s dragging so we must redraw
				}
				if (this.dragRadar) {
					this.changed = true;
					const rg = this.getRadarGeometry();
					const dX = mouse.x - rg.x;
					const dY = mouse.y - rg.y;
					const newAngle = Math.atan2(dY, dX) / Math.PI * 180;
					this.hotspots[this.currentHS].parent.angle = (Math.round((newAngle - this.dragRadarStartAngleDiff) * 100) / 100);
					this.angle = this.hotspots[this.currentHS].parent.angle;
					this.valid = false; // Something"s dragging so we must redraw
				}
			},

			onMouseUp: function (e) {
				this.dragging = false;
				this.dragRadar = false;
			},
			drawHotSpots: function () {
				this.hotspots.forEach((hs, i) => {
					this.ctx.drawImage(this.hotspotImg, hs.x, hs.y);
				});
				if (this.currentHS >= 0) {
					this.ctx.strokeStyle = "#CC0000";
					this.ctx.lineWidth = 2;
					this.ctx.strokeRect(this.hotspots[this.currentHS].x, this.hotspots[this.currentHS].y, this.hotspotDim.w, this.hotspotDim.h);
				}
			},

			drawRadar: function () {
				if (this.currentHS === -1) return;
				const rg = this.getRadarGeometry();
				this.ctx.save();
				this.ctx.beginPath();
				const startAngle = rg.start;
				const endAngle = rg.end;
				this.ctx.moveTo(rg.x, rg.y);
				this.ctx.arc(rg.x, rg.y, this.radarRadius, startAngle, endAngle, false);
				this.ctx.closePath();
				this.ctx.fillStyle = "rgba(255, 200, 150, 0.7)";
				this.ctx.fill();
				this.ctx.restore();
			},

			getRadarGeometry: function () {
				const newAngle = this.hotspots[this.currentHS].parent.angle * Math.PI / 180;
				const startAngle = (-1) * Math.PI * this.radarWidth / 2 / 180 + newAngle;
				const endAngle = Math.PI * this.radarWidth / 2 / 180 + newAngle;
				return {
					x: parseInt(this.hotspots[this.currentHS].x) + Math.floor(this.hotspotDim.w / 2),
					y: parseInt(this.hotspots[this.currentHS].y) + Math.floor(this.hotspotDim.h / 2),
					start: startAngle,
					end: endAngle
				};
			},

			isInsideSector: function (point, center, sectorStart, sectorEnd, radiusSquared) {
				const relPoint = {
					x: point.x - center.x,
					y: point.y - center.y
				};
				console.log({relPoint});
				return !this.areClockwise(sectorStart, relPoint) &&
					this.areClockwise(sectorEnd, relPoint) &&
					this.isWithinRadius(relPoint, radiusSquared);
			},

			areClockwise: function (v1, v2) {
				return -v1.x * v2.y + v1.y * v2.x > 0;
			},

			isWithinRadius: function (v, radiusSquared) {
				return v.x * v.x + v.y * v.y <= radiusSquared;
			},

			draw: function () {
				if (this.floor.name) {
					if (!this.valid) {
						this.frames++;
						this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
						this.ctx.drawImage(this.img, 0, 0);
						this.drawHotSpots();
						this.drawRadar();
						if (this.frames > 25) this.valid = true;
					}
				}
			}
		},
		watch: {
			saving(val) {
				if (!val && this.changed) {
					this.changed = false;
				}
			},
			changed(val) {
				if (val) {
					this.canvas.style.borderColor = "red";
				} else {
					this.canvas.style.borderColor = "green";
				}
			},
			currentHS(hs) {
				const sceneImg = document.getElementById("scene-img");
				if (hs >= 0) {
					sceneImg.src = `/resource/projects/${this.id}/fromtour/scene/thumb?scene=` + this.hotspots[hs].parent.name;
					this.x = this.hotspots[hs].x;
					this.y = this.hotspots[hs].y;
				} else {
					this.x = 0;
					this.y = 0;
					sceneImg.src = "";
					this.angle = 0;
				}
			},
			floor(val) {
				// console.log(val);
				this.frames = 0;
				this.changed = false;
				this.currentHS = -1;
				const image = this.xmlData[val.name]["image"];
				const _this = this;
				// const elem = document.getElementById("test");
				this.img = new Image;      // First create the image...
				this.img.onload = function () {  // ...then set the onload handler...
					_this.canvas.height = _this.img.height;
					_this.canvas.width = _this.img.width;
					_this.ctx.drawImage(_this.img, 0, 0);

				};
				this.img.src = `/resource/projects/${this.id}/getimage/floormap?floor=` + val.floor;
				this.updateHotSpots(val.name);
				this.drawHotSpots();
				this.valid = false;
			}
		},
		mounted: function () {
			this.id = this.$route.params.id;
			console.log("mounted", this.id);
			const _this = this;
			this.canvas = this.$refs.canvas;
			this.ctx = this.canvas.getContext("2d");
			const grd = this.ctx.createLinearGradient(0, 0, 100, 0);
			grd.addColorStop(0, "red");
			grd.addColorStop(1, "white");
			this.ctx.fillStyle = grd;
			this.ctx.fillRect(10, 10, 80, 80);
			this.hotspotImg = new Image;
			this.hotspotImg.onload = function () {  // ...then set the onload handler...
				_this.hotspotDim = {
					w: _this.hotspotImg.width,
					h: _this.hotspotImg.height
				};
				_this.ctx.drawImage(_this.hotspotImg, 0, 0);
			};
			this.hotspotImg.src = `/resource/projects/${this.id}/getimage/fromtemplate/radar`;
			setInterval(function () {
				_this.draw();
			}, _this.interval);
			this.canvas.addEventListener("mousedown", function (e) {
				_this.onMouseDown(e);
			}, true);
			this.canvas.addEventListener("mousemove", function (e) {
				_this.onMouseMove(e);
			}, true);
			this.canvas.addEventListener("mouseup", function (e) {
				_this.onMouseUp(e);
			}, true);
			this.canvas.addEventListener("mouseout", function (e) {
				_this.dragging = false;
			}, true);
		}
	};
</script>
<style scoped>
	.container {
		padding: unset !important;
	}
</style>
