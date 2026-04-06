const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { role, email, password, name, vehicleNumber, ambulanceType } = req.body;
  try {
    let user = await User.findOne({ email });
    
    if (user) {
      // User exists. Do they need their roles expanded?
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: "Email exists in system. Passwords do not match to link account." });
      
      if (user.roles.includes(role)) {
         return res.status(400).json({ error: `You are already registered as a ${role}` });
      }
      
      user.roles.push(role);
      await user.save();
    } else {
      // Create entirely new User
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({ name, email, password: hashedPassword, roles: [role] });
      await user.save();
    }

    if (role === 'driver') {
      const driver = new Driver({
        userId: user._id,
        vehicleNumber,
        ambulanceType,
        status: 'AVAILABLE'
      });
      await driver.save();
    }

    const token = jwt.sign({ userId: user._id, role: role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, role: role, userId: user._id, name: user.name });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, loginRole } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    if (!user.roles.includes(loginRole)) {
      return res.status(403).json({ error: `Account does not have ${loginRole} privileges. Sign up for this role first.` });
    }

    const token = jwt.sign({ userId: user._id, role: loginRole }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: loginRole, userId: user._id, name: user.name });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
