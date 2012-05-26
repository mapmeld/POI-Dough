var mongoose = require('mongoose'),
  mongoose_auth = require('mongoose-auth'),
  Schema = mongoose.Schema;

var POIMapSchema = new Schema({
  buildings: Array,
  parks: Array,
  basemap: String,
  createdby: String,
  updated: Date
});

var POIMap = mongoose.model('POIMap', POIMapSchema);

exports.POIMap = POIMap;
