import express from 'express';
import { auth } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleAuth.js';
import {
  createReport,
  getPatientReports,
  getDoctorReports,
  getReportById,
  updateReport,
  deleteReport
} from '../controllers/reportController.js';

const router = express.Router();

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
