import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import labRecordRoutes from './routes/labRecords.js';
import appointmentRoutes from './routes/appointments.js';
import doctorRoutes from './routes/doctors.js';
import patientRoutes from './routes/patients.js';
import { User } from './models/User.js'; 


// Load environment variables
dotenv.config();

// Admin seeding function
const seedAdmin = async () => {
  try {
    const adminEmail = 'admin@curabot.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const adminUser = new User({
        name: 'CuraBot Admin',
        email: adminEmail,
        password: 'curabot@admin1',
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '5001', 10);

// CORS Configuration for local development
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes
// Increase payload size limit for image uploads (base64 encoded images can be large)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/lab-records', labRecordRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CuraBot API' });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/curabot';
console.log('Attempting to connect to MongoDB:', MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Successfully connected to MongoDB');
    console.log('Database name:', mongoose.connection.db?.databaseName || 'Unknown');
    
    // Seed admin user
    await seedAdmin();
    
    // Log connection state
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
    });
    
    // Start server
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server is running on http://localhost:${port}`);
      console.log('Available routes:');
      console.log('  POST /api/auth/register - User registration');
      console.log('  POST /api/auth/login - User login');
      console.log('  GET /api/auth/me - Get current user');
      console.log('  GET /api/doctors - Get all doctors');
      console.log('  POST /api/doctors - Create doctor');
      console.log('  GET /api/patients - Get all patients');
      console.log('  POST /api/patients - Create patient');
      console.log('  GET /api/appointments - Get appointments');
      console.log('  POST /api/appointments - Create appointment');
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    console.error('Make sure MongoDB is running on your machine');
    process.exit(1);
  });