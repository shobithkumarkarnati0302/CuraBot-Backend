import express from 'express';
import { User } from '../models/User.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = new User({
      name,
      email,
      password, // Note: In production, you should hash the password
      role
    });
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(400).json({ message: 'Error creating user', error });
  }
});

export default router; 