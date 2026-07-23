const mongoose = require('mongoose');

const requestLogSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    required: true,
  },
  statusCode: {
    type: Number,
    required: true,
  },
  bandwidthBytes: {
    type: Number,
    default: 0,
  },
  cached: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('RequestLog', requestLogSchema);
