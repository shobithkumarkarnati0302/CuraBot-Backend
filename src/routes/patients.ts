import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Patient } from '../models/Patient.js';
import { auth, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all patients
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    // Only allow doctors and admins to view all patients
    if (req.user?.role !== 'doctor' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const patients = await Patient.find()
      .select('-__v')
      .sort({ name: 1 });
    res.json(patients);
  } catch (error: any) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Error fetching patients', details: error.message });
  }
});

// Get patient by ID
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const patient = await Patient.findById(req.params.id).select('-__v');
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Allow access if user is the patient, doctor, or admin
    if (req.user?.role === 'patient' && patient.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(patient);
  } catch (error: any) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Error fetching patient', details: error.message });
  }
});

// Create a new patient
router.post('/', 
  [
    body('name').trim().notEmpty().withMessage('Patient name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('phone').optional().trim(),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
    body('age').optional().isInt({ min: 0, max: 150 }).withMessage('Age must be between 0 and 150'),
    body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
    body('height').optional().trim(),
    body('weight').optional().trim(),
    body('occupation').optional().trim(),
    body('maritalStatus').optional().isIn(['Single', 'Married', 'Divorced', 'Widowed', 'Other']).withMessage('Invalid marital status'),
    body('address').optional().trim(),
    body('emergencyContact').optional().trim(),
    body('emergencyPhone').optional().trim(),
    body('insuranceProvider').optional().trim(),
    body('insuranceNumber').optional().trim(),
    body('medicalHistory').optional().isArray(),
    body('allergies').optional().isArray(),
    body('image').optional().trim()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        name, 
        email, 
        phone, 
        dateOfBirth,
        age,
        bloodGroup,
        gender,
        height,
        weight,
        occupation,
        maritalStatus,
        address,
        emergencyContact,
        emergencyPhone,
        insuranceProvider,
        insuranceNumber,
        medicalHistory,
        allergies,
        image,
        userId 
      } = req.body;

      // Check if patient with email already exists
      const existingPatient = await Patient.findOne({ email });
      if (existingPatient) {
        return res.status(400).json({ error: 'Patient with this email already exists' });
      }

      const patient = new Patient({
        name,
        email,
        phone,
        dateOfBirth,
        age,
        bloodGroup,
        gender,
        height,
        weight,
        occupation,
        maritalStatus,
        address,
        emergencyContact,
        emergencyPhone,
        insuranceProvider,
        insuranceNumber,
        medicalHistory: medicalHistory || [],
        allergies: allergies || [],
        image,
        userId
      });

      const savedPatient = await patient.save();
      res.status(201).json(savedPatient);
    } catch (error: any) {
      console.error('Error creating patient:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Patient with this email already exists' });
      }
      
      res.status(500).json({ error: 'Error creating patient', details: error.message });
    }
  }
);

// Update patient
router.put('/:id', 
  auth,
  [
    body('name').optional().trim().notEmpty().withMessage('Patient name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please enter a valid email'),
    body('phone').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
    body('age').optional().isInt({ min: 0, max: 150 }).withMessage('Age must be between 0 and 150'),
    body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
    body('height').optional().trim(),
    body('weight').optional().trim(),
    body('occupation').optional().trim(),
    body('maritalStatus').optional().isIn(['Single', 'Married', 'Divorced', 'Widowed', 'Other']).withMessage('Invalid marital status'),
    body('address').optional().trim(),
    body('emergencyContact').optional().trim(),
    body('emergencyPhone').optional().trim(),
    body('insuranceProvider').optional().trim(),
    body('insuranceNumber').optional().trim(),
    body('medicalHistory').optional().isArray(),
    body('allergies').optional().isArray(),
    body('image').optional().trim()
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const patient = await Patient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Allow access if user is the patient, doctor, or admin
      if (req.user?.role === 'patient' && patient.userId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedPatient = await Patient.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      res.json(updatedPatient);
    } catch (error: any) {
      console.error('Error updating patient:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Patient with this email already exists' });
      }
      
      res.status(500).json({ error: 'Error updating patient', details: error.message });
    }
  }
);

// Delete patient (only admins can delete)
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete patients' });
    }

    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Error deleting patient', details: error.message });
  }
});

// Get patient's medical history
router.get('/:id/medical-history', auth, async (req: AuthRequest, res: Response) => {
  try {
    const patient = await Patient.findById(req.params.id).select('medicalHistory allergies');
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Allow access if user is the patient, doctor, or admin
    if (req.user?.role === 'patient' && patient.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      medicalHistory: patient.medicalHistory,
      allergies: patient.allergies
    });
  } catch (error: any) {
    console.error('Error fetching medical history:', error);
    res.status(500).json({ error: 'Error fetching medical history', details: error.message });
  }
});

export default router;
