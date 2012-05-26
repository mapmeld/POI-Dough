var mongoose = require('mongoose'),
    mongoose_auth = require('mongoose-auth'),
    Schema = mongoose.Schema;

var POIMapSchema = new Schema({
    body      : String,
    date      : Date
});

var POIMap = mongoose.model('POIMap', POIMapSchema);

exports.POIMap = POIMap;
