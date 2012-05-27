var mongoose = require('mongoose'),
  mongoose_auth = require('mongoose-auth'),
  Schema = mongoose.Schema;

// Project Kansas: Procedural Buildings and Art Effects
// Using HTML5 Canvas

var ProcedureSchema = new Schema({
  name: String,
  variables: Array,
  code: String,
  forked_from: Array,
  created_by: String,
  updated: Date
});

var Procedure = mongoose.model('Procedure', ProcedureSchema);

exports.Procedure = Procedure;
