import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';

// Load environment variables
dotenv.config();

async function testRegistration() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/CuraBot1';
    console.log('Connecting to:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test user data
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpass123',
      role: 'patient'
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: testUser.email });
    if (existingUser) {
      console.log('🗑️ Removing existing test user...');
      await User.deleteOne({ email: testUser.email });
    }

    // Create new user
    console.log('🔄 Creating new user...');
    const user = new User(testUser);
    
    // Save user
    const savedUser = await user.save();
    console.log('✅ User saved successfully:', {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role
    });

    // Verify user exists in database
    const foundUser = await User.findById(savedUser._id);
    console.log('✅ User found in database:', foundUser ? 'Yes' : 'No');

    // List all users in collection
    const allUsers = await User.find({});
    console.log('📊 Total users in database:', allUsers.length);

    // Generate token test
    const token = savedUser.generateAuthToken();
    console.log('✅ Token generated:', token ? 'Yes' : 'No');

  } catch (error) {
    console.error('❌ Registration test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testRegistration();
