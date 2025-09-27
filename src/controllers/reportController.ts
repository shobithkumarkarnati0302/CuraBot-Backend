import { Request, Response } from 'express';
import Report from '../models/Report.js';
import { Appointment } from '../models/Appointment.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';

// Create a new report (Doctor only)
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== CREATE REPORT REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    const { appointmentId, title, diagnosis, prescription, recommendations, notes } = req.body;
    const doctorId = req.user?._id;
    
    console.log('Extracted data:', { appointmentId, title, diagnosis, prescription, recommendations, notes, doctorId });

    // First, find the appointment by ID
    console.log('Looking for appointment with ID:', appointmentId);
    const appointment = await Appointment.findById(appointmentId).populate('patient');
    
    console.log('Found appointment:', appointment);
    
    if (!appointment) {
      console.log('Appointment not found');
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify the appointment belongs to this doctor (check multiple possible fields)
    const doctorName = req.user?.name?.toLowerCase();
    const appointmentDoctorFields = [
      appointment.doctor?.toLowerCase(),
      (appointment as any).doctorName?.toLowerCase(),
      (appointment as any).fullName?.toLowerCase()
    ].filter(Boolean);

    console.log('Doctor authorization check:', {
      userDoctorName: doctorName,
      appointmentDoctorFields,
      appointmentDoctor: appointment.doctor
    });

    const isDoctorMatch = appointmentDoctorFields.some(field => 
      field === doctorName || field?.includes(doctorName) || doctorName?.includes(field)
    );

    if (!isDoctorMatch) {
      console.log('Doctor authorization failed:', {
        userDoctorName: doctorName,
        appointmentDoctorFields,
        appointmentId
      });
      return res.status(403).json({ message: 'Not authorized to create report for this appointment' });
    }

    console.log('Doctor authorization successful');

    // Check if report already exists for this appointment
    const existingReport = await Report.findOne({ appointmentId });
    if (existingReport) {
      return res.status(400).json({ message: 'Report already exists for this appointment' });
    }

    console.log('Creating report with data:', {
      patientId: appointment.patient,
      doctorId,
      appointmentId,
      title,
      diagnosis,
      prescription,
      recommendations,
      notes
    });

    const report = new Report({
      patientId: appointment.patient,
      doctorId,
      appointmentId,
      title,
      diagnosis,
      prescription,
      recommendations,
      notes
    });

    console.log('Saving report...');
    await report.save();
    console.log('Report saved successfully with ID:', report._id);

    // Populate the report with doctor details
    const populatedReport = await Report.findById(report._id)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name email');

    res.status(201).json({
      message: 'Report created successfully',
      report: populatedReport
    });
  } catch (error: any) {
    console.error('Error creating report:', error);
    console.error('Request body:', req.body);
    console.error('User:', req.user);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all reports for a patient
export const getPatientReports = async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.user?._id;

    const reports = await Report.find({ patientId })
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching patient reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all reports created by a doctor
export const getDoctorReports = async (req: AuthRequest, res: Response) => {
  try {
    const doctorId = req.user?._id;

    const reports = await Report.find({ doctorId })
      .populate('patientId', 'name email')
      .populate('appointmentId', 'date time')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching doctor reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all reports (Admin only)
export const getAllReports = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== GET ALL REPORTS REQUEST ===');
    console.log('User:', req.user);
    console.log('User role:', req.user?.role);
    
    // First, let's check if there are any reports at all
    const reportCount = await Report.countDocuments();
    console.log('Total reports in database:', reportCount);
    
    if (reportCount === 0) {
      console.log('No reports found in database');
      return res.json([]);
    }
    
    const reports = await Report.find({})
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });

    console.log('Found reports:', reports.length);
    
    // Simple transformation without complex population logic
    const transformedReports = reports.map(report => {
      const patientData = report.patientId as any;
      const doctorData = report.doctorId as any;
      
      return {
        _id: report._id,
        appointmentId: report.appointmentId,
        patientId: patientData?._id || report.patientId,
        doctorId: doctorData?._id || report.doctorId,
        patientName: patientData?.name || 'Unknown Patient',
        doctorName: doctorData?.name || 'Unknown Doctor',
        diagnosis: report.diagnosis || '',
        prescription: report.prescription || '',
        recommendations: report.recommendations || '',
        notes: report.notes || '',
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      };
    });

    console.log('Transformed reports:', transformedReports);
    res.json(transformedReports);
  } catch (error) {
    console.error('Error fetching all reports:', error);
    console.error('Error stack:', (error as any).stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: (error as any).message,
      stack: process.env.NODE_ENV === 'development' ? (error as any).stack : undefined
    });
  }
};

// Get a specific report by ID
export const getReportById = async (req: AuthRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const report = await Report.findById(reportId)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name email')
      .populate('appointmentId', 'date time');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check authorization - only the patient or doctor involved can access the report
    const isAuthorized = 
      (userRole === 'patient' && report.patientId._id.toString() === userId) ||
      (userRole === 'doctor' && report.doctorId._id.toString() === userId) ||
      userRole === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to access this report' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a report (Doctor only)
export const updateReport = async (req: AuthRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const { title, diagnosis, prescription, recommendations, notes } = req.body;
    const doctorId = req.user?._id;

    const report = await Report.findOne({
      _id: reportId,
      doctorId: doctorId
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found or not authorized' });
    }

    // Update the report
    report.title = title || report.title;
    report.diagnosis = diagnosis || report.diagnosis;
    report.prescription = prescription || report.prescription;
    report.recommendations = recommendations || report.recommendations;
    report.notes = notes !== undefined ? notes : report.notes;

    await report.save();

    // Populate and return updated report
    const updatedReport = await Report.findById(report._id)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name email');

    res.json({
      message: 'Report updated successfully',
      report: updatedReport
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a report (Doctor only)
export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const doctorId = req.user?._id;

    const report = await Report.findOne({
      _id: reportId,
      doctorId: doctorId
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found or not authorized' });
    }

    await Report.findByIdAndDelete(reportId);

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
