import express from 'express';
import { auth } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';
import Report from '../models/Report.js';
import {
  createReport,
  getPatientReports,
  getDoctorReports,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport
} from '../controllers/reportController.js';

const router = express.Router();

// Get all reports (Admin only)
router.get('/all', auth, authorizeRoles(['admin']), getAllReports);

// Test endpoint to check reports without auth (for debugging)
router.get('/test', async (req, res) => {
  try {
    const reportCount = await Report.countDocuments();
    const reports = await Report.find({}).limit(5);
    res.json({
      message: 'Test endpoint',
      totalReports: reportCount,
      sampleReports: reports,
      note: reportCount === 0 ? 'No reports found. Create reports by: 1) Login as doctor, 2) Complete an appointment, 3) Generate report' : 'Reports found'
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: (error as any).message });
  }
});

// Create a new report (Doctor only)
router.post('/', auth, authorizeRoles(['doctor']), createReport);

// Get reports for the authenticated patient
router.get('/patient', auth, authorizeRoles(['patient']), getPatientReports);

// Get reports created by the authenticated doctor
router.get('/doctor', auth, authorizeRoles(['doctor']), getDoctorReports);

// Get a specific report by ID
router.get('/:reportId', auth, getReportById);

// Update a report (Doctor only)
router.put('/:reportId', auth, authorizeRoles(['doctor']), updateReport);

// Delete a report (Doctor only)
router.delete('/:reportId', auth, authorizeRoles(['doctor']), deleteReport);

export default router;
