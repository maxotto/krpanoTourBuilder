<template>
	<v-container align-content-center class="upload">
		<file-upload
			v-show="template.state"
			:post-action="`/upload/floorImage/${recordId}/${template.number}`"
			:input-id="`file${template.number}`"
			extensions="gif,jpg,jpeg,png,webp"
			accept="image/png,image/gif,image/jpeg,image/webp"
			:multiple="false"
			:size="1024 * 1024 * 10"
			v-model="template.files"
			@input-filter="inputFilter"
			@input-file="inputFile"
			:ref="`upload${template.number}`">
			<v-btn small :ref="`uploadbtn${template.number}`">
				<template v-if="template.uploaded">
					<v-icon>
						mdi-reload
					</v-icon>
					Change map image
				</template>
				<template v-else>
					<v-icon>
						mdi-plus
					</v-icon>
					Add map image
				</template>
			</v-btn>
		</file-upload>
		<p v-for="(file, index) in template.files" :key="file.id">
			Loading:
			<span v-if="file.error" style="color:red; font-weight: 800">{{file.error}}</span>
			<span v-else-if="file.success" style="color:blue; font-weight: 800">success</span>
			<span v-else-if="file.active" style="color:green; font-weight: 800">in process</span>
			<span v-else></span>
		</p>
	</v-container>
</template>

<script>
	import FileUpload from "vue-upload-component";

	export default {
		name: "uploadBlock",
		components: {FileUpload},
		props: ["template", "recordId", "forceUpload"],
		data() {
			return {
				uploaderActive: false,
			}
		},
		mounted() {
			const n = "upload" + this.template.number;
			this.$watch(
				() => {
					return this.$refs[n].active
				},
				(val) => {
					this.uploaderActive = val;
					// alert("$watch Active: " + val)
				}
			)
		},
		watch: {
			forceUpload(val) {
				if (val && !this.template.uploaded) {
					// console.log("forceUpload",val);
					// this.startUpload(this.template.number);
					var btn = this.$refs["uploadbtn" + this.template.number];
					document.getElementById("file" + this.template.number).click();
					// console.log({input});
					// input.click();
					// btn.trigger("click");
				}
			}
		},
		methods: {
			startUpload(floorNumber) {
				// console.log("start this", floorNumber);
				// console.log(this.$refs);
				this.$refs["upload" + floorNumber].active = true;
			},

			inputFilter(newFile, oldFile, prevent) {
				if (newFile && !oldFile) {
					// Before adding a file
					// 添加文件前
					// Filter system files or hide files
					// 过滤系统文件 和隐藏文件
					if (/(\/|^)(Thumbs\.db|desktop\.ini|\..+)$/.test(newFile.name)) {
						return prevent()
					}
					// Filter php html js file
					// 过滤 php html js 文件
					if (/\.(php5?|html?|jsx?)$/i.test(newFile.name)) {
						return prevent()
					}
				}
			},
			inputFile(newFile, oldFile) {
				if (newFile && newFile.success !== false) {
					// console.log("success??", newFile, oldFile, this.template.number);
					//this.response = newFile.response;
					this.$emit("clicked", this.template.number);
				}
				if (newFile && !oldFile) {
					// add
					//console.log("add", newFile);
					this.startUpload(this.template.number);
				}
				if (newFile && oldFile) {
					// update
					//console.log("update", newFile)
				}
				if (!newFile && oldFile) {
					// remove
					//console.log("remove", oldFile)
				}
			}
		}
	}
</script>

<style scoped>
	.upload {
		padding-top: unset;
		padding-bottom: unset;
	}

	p {
		text-align: center;
		margin: unset;
		padding: unset;
	}
</style>
