const mongoose = require('mongoose');

const WorkingHoursSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6 // 0 = Sonntag, 6 = Samstag
  },
  start: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/ // Format: "HH:MM"
  },
  end: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/ // Format: "HH:MM"
  },
  isForTattoo: {
    type: Boolean,
    default: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index für effiziente Abfragen nach Wochentag und Benutzer
WorkingHoursSchema.index({ user: 1, dayOfWeek: 1 });

module.exports = mongoose.model('WorkingHours', WorkingHoursSchema);

