const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  vehicleNumber: { type: String, required: true },
  ambulanceType: { type: String, enum: ['public', 'private'], required: true },
  status: { type: String, enum: ['AVAILABLE', 'BUSY'], default: 'AVAILABLE' },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
