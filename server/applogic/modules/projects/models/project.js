const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const commonLib = require('./lib');

const ProjectSchema = new Schema({
	user:{
		type: Number,
		required: true
	},
  title: {
    type: String,
    unique: true,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  template: {
    type: String,
    required: true,
  },
  showMap: Boolean,
  useCustomMap: Boolean,
  language: String,
  loadingtext: String,
  googleMapUnits: String,
  useFixedZoom: Boolean,
  iniZoom: Number,
  floorMapShift:{
    x: Number,
    y: Number,
  },
  location: {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  state: {
    uploaded: {
      type: Boolean,
      required: true,
    },
    floors: {
      type: Boolean,
      required: true,
    },
    floorsImages: {
      type: Boolean,
      required: true,
    },
    hotspots: {
      type: Boolean,
      required: true,
    },
    lookatTag: {
      type: Boolean,
      required: true,
    },
    needRebuild: {
      type: Boolean,
      required: true,
    },
    built: {
      type: Boolean,
      required: true,
    },
    lookatValue: {
      type: Boolean,
      required: true,
    },
    planHotspots: {
      type: Boolean,
      required: true,
    },
  },
  floorSelect:{
    type: Array
  },
  tour: {
    type: String
  },

});

ProjectSchema.pre('save', function(next) {
  this.state = commonLib.calcState(this);
  this.markModified('state.floors');
  next();
});

const ProjectModel = mongoose.model('projects', ProjectSchema);

module.exports = ProjectModel;
