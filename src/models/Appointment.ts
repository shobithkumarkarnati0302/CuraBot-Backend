import mongoose, { Schema, Document } from 'mongoose';

// This interface matches all the fields in your frontend form
export interface IAppointment extends Document {
  // From Step 1 of the form
  fullName: string;
  email: string;
  phone: string;
  
  // From Step 2 of the form
  date: string;
  time: string;
  department: string;
  doctor: string; // Storing doctor's name as a string as per the form
  reason: string;
  
  // From Step 3 of the form
  notes: string;
  insuranceProvider: string;
  insuranceNumber: string;
  emergencyContact: string;
  emergencyPhone: string;

  // System-managed fields
  status: 'pending' | 'confirmed' | 'scheduled' | 'completed' | 'cancelled';
  completed: boolean;
  patient: mongoose.Schema.Types.ObjectId; // Link to the user who booked it
}

const AppointmentSchema: Schema = new Schema({
  // Step 1
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },

  // Step 2
  date: { type: String, required: true },
  time: { type: String, required: true },
  department: { type: String, required: true },
  doctor: { type: String, required: true },
  reason: { type: String },

  // Step 3
  notes: { type: String },
  insuranceProvider: { type: String },
  insuranceNumber: { type: String },
  emergencyContact: { type: String },
  emergencyPhone: { type: String },

  // System fields
  status: { type: String, enum: ['pending', 'confirmed', 'scheduled', 'completed', 'cancelled'], default: 'pending' },
  completed: { type: Boolean, default: false },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
