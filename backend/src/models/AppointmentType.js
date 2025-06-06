const mongoose = require('mongoose');

const AppointmentTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    default: '#3B82F6' // Standardfarbe: Blau
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  duration: {
    type: Number,
    required: true,
    default: 60 // Standarddauer in Minuten
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AppointmentType', AppointmentTypeSchema);

