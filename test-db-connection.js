import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';

// Load environment variables
dotenv.config();

async function testDatabaseConnection() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/CuraBot1';
    console.log('🔌 Connecting to:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB');
    console.log('📊 Database name:', mongoose.connection.db?.databaseName || 'Unknown');

    // Test creating a user
    const testUserData = {
      name: 'Test Patient',
      email: 'testpatient@example.com',
      password: 'testpass123',
      role: 'patient'
    };

    // Remove existing test user if exists
    await User.deleteOne({ email: testUserData.email });
    console.log('🗑️ Cleaned up existing test user');

    // Create and save new user
    console.log('👤 Creating new user...');
    const user = new User(testUserData);
    const savedUser = await user.save();
    
    console.log('✅ User created successfully!');
    console.log('   ID:', savedUser._id);
    console.log('   Name:', savedUser.name);
    console.log('   Email:', savedUser.email);
    console.log('   Role:', savedUser.role);

    // Test token generation
    const token = savedUser.generateAuthToken();
    console.log('🔑 Token generated:', token ? 'Yes' : 'No');

    // Verify user exists in database
    const foundUser = await User.findById(savedUser._id);
    console.log('🔍 User found in database:', foundUser ? 'Yes' : 'No');

    // Count total users
    const userCount = await User.countDocuments();
    console.log('📈 Total users in database:', userCount);

    // List collections in database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Collections in database:', collections.map(c => c.name));

    console.log('\n🎉 Registration functionality is working correctly!');
    console.log('✅ Users will be saved to the "users" collection in CuraBot1 database');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })));
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

console.log('🧪 Testing CuraBot Registration & Database Connection...\n');
testDatabaseConnection();
