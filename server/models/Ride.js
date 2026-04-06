const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  ambulanceType: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'BUSY', 'ON_THE_WAY', 'ARRIVED', 'COMPLETED', 'REJECTED'], default: 'PENDING' },
  driverName: { type: String },
  vehicleNumber: { type: String },
  estimatedETAMinutes: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);
