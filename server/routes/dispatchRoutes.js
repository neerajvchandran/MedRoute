const express = require('express');
const Driver = require('../models/Driver');
const Ride = require('../models/Ride');
const User = require('../models/User');

const router = express.Router();

// Get active drivers (for Patient dashboard)
router.get('/drivers/available', async (req, res) => {
  const { type } = req.query; // 'public', 'private', or 'any'
  try {
    let query = { status: 'AVAILABLE' };
    if (type && type !== 'any') {
      query.ambulanceType = type;
    }
    
    // We populate user details for names
    const drivers = await Driver.find(query).populate('userId', 'name');
    const enriched = drivers.map(d => ({
      driverId: d.userId._id,
      name: d.userId.name,
      vehicleNumber: d.vehicleNumber,
      ambulanceType: d.ambulanceType,
      status: d.status,
      currentLocation: d.currentLocation
    }));

    res.json(enriched);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Book a ride
router.post('/rides', async (req, res) => {
  const { patientId, driverId, patientLocation, ambulanceType, driverName, vehicleNumber, estimatedETAMinutes } = req.body;
  try {
    const ride = new Ride({
      patientId, driverId, patientLocation, ambulanceType, driverName, vehicleNumber, estimatedETAMinutes, status: 'PENDING'
    });
    await ride.save();
    res.status(201).json(ride);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Polling Active Rides for a specific user or driver
router.get('/rides/active', async (req, res) => {
  const { userId, role } = req.query;
  try {
    let query = {};
    if (role === 'driver') {
      query = { driverId: userId, status: { $in: ['PENDING', 'BUSY', 'ON_THE_WAY', 'ARRIVED'] } };
    } else if (role === 'patient') {
      query = { patientId: userId, status: { $ne: 'COMPLETED' } }; // active for patient
    } else if (role === 'hospital') {
       query = { status: { $in: ['BUSY', 'ON_THE_WAY', 'ARRIVED'] } }; // all active
    }

    const rides = await Ride.find(query).sort({createdAt:-1});
    // For specific users we usually just care about the most recent one
    if (role === 'hospital') return res.json(rides);
    
    res.json(rides.length > 0 ? rides[0] : null);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Ride Status
router.put('/rides/:id/status', async (req, res) => {
  const { status, driverId } = req.body;
  try {
    const ride = await Ride.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    if (driverId) {
       // Update Driver status internally
      if (['BUSY', 'ON_THE_WAY', 'ARRIVED'].includes(status)) {
        await Driver.findOneAndUpdate({ userId: driverId }, { status: 'BUSY' });
      } else if (['COMPLETED', 'REJECTED'].includes(status)) {
        await Driver.findOneAndUpdate({ userId: driverId }, { status: 'AVAILABLE' });
      }
    }
    
    res.json(ride);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Driver Profile
router.get('/drivers/me', async (req, res) => {
  const { userId } = req.query;
  try {
    const driver = await Driver.findOne({ userId }).populate('userId', 'name');
    res.json({
      vehicleNumber: driver.vehicleNumber,
      status: driver.status,
      currentLocation: driver.currentLocation,
      ambulanceType: driver.ambulanceType
    });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
