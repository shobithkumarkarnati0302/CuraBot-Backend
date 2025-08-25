import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  age?: number;
  bloodGroup?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  medicalHistory?: string[];
  allergies?: string[];
  height?: string;
  weight?: string;
  occupation?: string;
  maritalStatus?: string;
  image?: string; // Profile photo (base64 or URL)
  userId?: mongoose.Schema.Types.ObjectId; // Link to User model
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  age: {
    type: Number,
    min: [0, 'Age must be a positive number'],
    max: [150, 'Age must be realistic']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  emergencyContact: {
    type: String,
    trim: true
  },
  emergencyPhone: {
    type: String,
    trim: true
  },
  insuranceProvider: {
    type: String,
    trim: true
  },
  insuranceNumber: {
    type: String,
    trim: true
  },
  medicalHistory: [{
    type: String,
    trim: true
  }],
  allergies: [{
    type: String,
    trim: true
  }],
  height: {
    type: String,
    trim: true
  },
  weight: {
    type: String,
    trim: true
  },
  occupation: {
    type: String,
    trim: true
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Other'],
    trim: true
  },
  image: {
    type: String, // Base64 encoded image or URL
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true // Allow null values but enforce uniqueness when present
  }
}, {
  timestamps: true
});

// Index for better query performance
PatientSchema.index({ phone: 1 });

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
