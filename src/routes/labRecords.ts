import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { getLabRecords, createLabRecord, deleteLabRecord } from '../controllers/labRecord.controller.js';

const router = express.Router();

// GET /api/lab-records - Fetches lab records for the logged-in user
router.get('/', auth, getLabRecords);

// POST /api/lab-records - Creates a new lab record, restricted to doctors and admins
router.post('/', auth, checkRole(['doctor', 'admin']), createLabRecord);

// DELETE /api/lab-records/:id - Deletes a lab record
router.delete('/:id', auth, deleteLabRecord);

export default router;