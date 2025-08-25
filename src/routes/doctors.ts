import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Doctor } from '../models/Doctor.js';
import { auth, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all doctors
router.get('/', async (req: Request, res: Response) => {
  try {
    const doctors = await Doctor.find({ status: 'active' })
      .select('-__v')
      .sort({ name: 1 });
    res.json(doctors);
  } catch (error: any) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Error fetching doctors', details: error.message });
  }
});

// Get doctor by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-__v');
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (error: any) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ error: 'Error fetching doctor', details: error.message });
  }
});

// Create a new doctor
router.post('/', 
  [
    body('name').trim().notEmpty().withMessage('Doctor name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('specialty').trim().notEmpty().withMessage('Specialty is required'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
    body('phone').optional().trim(),
    body('experience').optional().trim(),
    body('education').optional().trim(),
    body('age').optional().isInt({ min: 0 }).withMessage('Age must be a positive integer'),
    body('image').optional().isString().withMessage('Image must be a string (base64 or URL)')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, specialty, status, phone, experience, education, userId } = req.body;

      // Check if doctor with email already exists
      const existingDoctor = await Doctor.findOne({ email });
      if (existingDoctor) {
        return res.status(400).json({ error: 'Doctor with this email already exists' });
      }

      const doctor = new Doctor({
        name,
        email,
        specialty,
        status: status || 'active',
        phone: phone || '',
        experience: experience || '',
        education: education || '',
        userId
      });

      const savedDoctor = await doctor.save();
      res.status(201).json(savedDoctor);
    } catch (error: any) {
      console.error('Error creating doctor:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Doctor with this email already exists' });
      }
      
      res.status(500).json({ error: 'Error creating doctor', details: error.message });
    }
  }
);

// Update doctor
router.put('/:id', 
  auth,
  [
    body('name').optional().trim().notEmpty().withMessage('Doctor name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please enter a valid email'),
    body('specialty').optional().trim().notEmpty().withMessage('Specialty cannot be empty'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
    body('phone').optional().trim(),
    body('experience').optional().trim(),
    body('education').optional().trim(),
    body('age').optional().isInt({ min: 0 }).withMessage('Age must be a positive integer'),
    body('image').optional().isString().withMessage('Image must be a string (base64 or URL)')
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const doctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      res.json(doctor);
    } catch (error: any) {
      console.error('Error updating doctor:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Doctor with this email already exists' });
      }
      
      res.status(500).json({ error: 'Error updating doctor', details: error.message });
    }
  }
);

// Delete doctor (soft delete by setting status to inactive)
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ message: 'Doctor deactivated successfully', doctor });
  } catch (error: any) {
    console.error('Error deactivating doctor:', error);
    res.status(500).json({ error: 'Error deactivating doctor', details: error.message });
  }
});

// Get doctors by specialty
router.get('/specialty/:specialty', async (req: Request, res: Response) => {
  try {
    const doctors = await Doctor.find({ 
      specialty: new RegExp(req.params.specialty, 'i'),
      status: 'active'
    }).select('-__v').sort({ name: 1 });
    
    res.json(doctors);
  } catch (error: any) {
    console.error('Error fetching doctors by specialty:', error);
    res.status(500).json({ error: 'Error fetching doctors', details: error.message });
  }
});

export default router;
