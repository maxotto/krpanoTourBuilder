<template>
	<v-app>
		<h1>Plan editor</h1>
		<p>ID={{id}}</p>
		<p>Floor={{floor}}</p>
		<p>Items={{items}}</p>
		<v-container fluid>
			<v-tabs
				slider-color="green"
				centered
			>
				<v-tab key="1" riple>
					Hotspots on a plan
				</v-tab>
				<v-tab key="2" riple>
					LookAt of scenes
				</v-tab>
				<v-tab-item key="1">
					<v-layout column align-center>
						<v-select
							v-model="floor"
							:items="items"
							item-text="name"
							item-value="floor"
							label="Select floor to edit"
							persistent-hint
							return-object
							single-line
						></v-select>
						<plan-editor :floor="floor" :xmlData="xmlData"></plan-editor>
					</v-layout>
				</v-tab-item>
				<v-tab-item key="2">
					<v-layout column align-center>
						<look-at-editor></look-at-editor>
					</v-layout>
				</v-tab-item>
			</v-tabs>
		</v-container>
	</v-app>
</template>

<script>
	import planEditor from "./planEditor.vue";
	import lookAtEditor from "./lookAtEditor.vue";
	import { mapGetters, mapActions } from "vuex";

	export default {
		name: "planLookatEditor",
		components: {
			planEditor,
			lookAtEditor
		},
		data: function () {
			return {
				id: undefined,
				floor: {},
				items: [],
				project: undefined,
				xmlData: undefined,
			};
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
				"removeRow",
				"clearBuildLog",
				"addBuildLogMessage",
				"getPlanEditInfo"
			]),
			getProject() {
				const i = this.projects.findIndex(p => {
					return (p._id === this.id);
				});
				this.project = this.projects[i];
			},
			setProject(){
				this.xmlData = this.planEditInfo.planHotspotsData;
				for(let plan in this.xmlData){
					if(this.xmlData.hasOwnProperty(plan)){
						this.items.push({
							floor: this.xmlData[plan].floor,
							name: plan,
							image: this.xmlData[plan].image
						});

					}
				}
			},
		},
		watch: {
			planEditInfo(val){
				this.setProject();
			}
		},
		computed: {
			...mapGetters("projects", [
				"projects",
				"selected",
				"errors",
				"success",
				"buildLog",
				"planEditInfo",
			]),
		},
		mounted(){
			this.id = this.$route.params.id;
			this.getProject();
			this.getPlanEditInfo(this.id);
		}
	};
</script>

<style scoped>
	h1, h2 {
		font-weight: normal;
	}
	ul {
		list-style-type: none;
		padding: 0;
	}
	li {
		display: inline-block;
		margin: 0 10px;
	}
	a {
		color: #42b983;
	}
	.container {
		padding: unset!important;
	}
</style>

