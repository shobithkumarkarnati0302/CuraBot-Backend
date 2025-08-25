import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  email: string;
  specialty: string;
  status: 'active' | 'inactive';
  phone: string;
  experience: string;
  education: string;
  age?: number;
  image?: string; // base64 or URL
  userId?: mongoose.Schema.Types.ObjectId; // Link to User model
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Doctor name is required'],
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
  specialty: {
    type: String,
    required: [true, 'Specialty is required'],
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: '{VALUE} is not a valid status'
    },
    default: 'active'
  },
  phone: {
    type: String,
    trim: true
  },
  experience: {
    type: String,
    trim: true
  },
  education: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: 0
  },
  image: {
    type: String,
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
DoctorSchema.index({ specialty: 1 });
DoctorSchema.index({ status: 1 });

export const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema);
