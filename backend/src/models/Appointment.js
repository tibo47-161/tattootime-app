const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
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
  appointmentType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentType'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  notes: {
    type: String,
    // In einer Produktionsumgebung würde hier eine Verschlüsselung implementiert werden
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  tattooDetails: {
    motif: {
      type: String,
      // In einer Produktionsumgebung würde hier eine Verschlüsselung implementiert werden
    },
    bodyPart: String,
    size: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingToken: {
    type: String,
    // Token für Stornierung/Umbuchung
  }
}, {
  timestamps: true
});

// Index für effiziente Abfragen nach Datum
AppointmentSchema.index({ start: 1 });
AppointmentSchema.index({ user: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);

