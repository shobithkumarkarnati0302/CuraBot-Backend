import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  title: string;
  diagnosis: string;
  prescription: string;
  recommendations: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  diagnosis: {
    type: String,
    required: true,
    trim: true
  },
  prescription: {
    type: String,
    required: true,
    trim: true
  },
  recommendations: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
ReportSchema.index({ patientId: 1, createdAt: -1 });
ReportSchema.index({ doctorId: 1, createdAt: -1 });
ReportSchema.index({ appointmentId: 1 });

export default mongoose.model<IReport>('Report', ReportSchema);
