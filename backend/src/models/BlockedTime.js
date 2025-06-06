const mongoose = require('mongoose');

const BlockedTimeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  reason: {
    type: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index für effiziente Abfragen nach Datum
BlockedTimeSchema.index({ start: 1 });
BlockedTimeSchema.index({ user: 1 });

module.exports = mongoose.model('BlockedTime', BlockedTimeSchema);

