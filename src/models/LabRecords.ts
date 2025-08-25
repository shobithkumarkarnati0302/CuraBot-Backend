import mongoose, { Schema, Document } from 'mongoose';

export interface ILabRecord extends Document {
  testName: string;
  date: string;
  category: string;
  status: 'completed' | 'pending' | 'processing';
  result?: string;
  patient: mongoose.Schema.Types.ObjectId;
  doctor: string; // <-- This is the corrected field
}

const LabRecordSchema: Schema = new Schema({
  testName: { type: String, required: true },
  date: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, enum: ['completed', 'pending', 'processing'], default: 'pending', required: true },
  result: { type: String },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // --- THIS IS THE FIX ---
  // The doctor field is now a simple String to match the form data.
  doctor: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const LabRecord = mongoose.model<ILabRecord>('LabRecord', LabRecordSchema);