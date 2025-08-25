import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Appointment } from '../models/Appointment.js';
import { auth, AuthRequest, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Get all appointments (admin only) or filter by doctor/patient
router.get('/', 
  auth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { doctor, patient } = req.query;
      let query: any = {};

      // Role-based filtering
      if (req.user?.role === 'patient') {
        query.patient = req.user._id;
      } else if (req.user?.role === 'doctor' && !doctor && !patient) {
        // If doctor doesn't specify filters, show their appointments
        query.doctor = req.user.name;
      }

      // Apply query filters if provided
      if (doctor) {
        query.doctor = doctor;
      }
      if (patient) {
        query.patient = patient;
      }

      const appointments = await Appointment.find(query)
        .populate('patient', 'name email')
        .sort({ createdAt: -1 });

      // Transform appointments to match frontend AppointmentData interface
      const transformedAppointments = appointments.map(appointment => ({
        _id: appointment._id,
        patientId: (appointment.patient as any)?._id?.toString() || '',
        doctorId: (appointment.patient as any)?._id?.toString() || '', // Will be updated when doctor model is linked
        patientName: appointment.fullName,
        doctorName: appointment.doctor,
        fullName: appointment.fullName,
        email: appointment.email,
        phone: appointment.phone,
        patientEmail: appointment.email,
        patientPhone: appointment.phone,
        date: appointment.date,
        time: appointment.time,
        department: appointment.department,
        doctor: appointment.doctor,
        reason: appointment.reason,
        condition: appointment.reason,
        status: appointment.status,
        completed: appointment.completed,
        notes: appointment.notes,
        insuranceProvider: appointment.insuranceProvider,
        insuranceNumber: appointment.insuranceNumber,
        emergencyContact: appointment.emergencyContact,
        emergencyPhone: appointment.emergencyPhone
      }));

      res.json(transformedAppointments);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: 'Error fetching appointments', details: error.message });
    }
  }
);

// Get appointments by doctor name
router.get('/doctor/:doctorName', auth, async (req: AuthRequest, res: Response) => {
  try {
    const appointments = await Appointment.find({
      doctor: new RegExp(req.params.doctorName, 'i')
    })
    .populate('patient', 'name email')
    .sort({ date: -1, time: -1 });
    
    // Transform appointments to match frontend AppointmentData interface
    const transformedAppointments = appointments.map(appointment => ({
      _id: appointment._id,
      patientId: (appointment.patient as any)?._id?.toString() || '',
      doctorId: (appointment.patient as any)?._id?.toString() || '', // Will be updated when doctor model is linked
      patientName: appointment.fullName,
      doctorName: appointment.doctor,
      fullName: appointment.fullName,
      email: appointment.email,
      phone: appointment.phone,
      patientEmail: appointment.email,
      patientPhone: appointment.phone,
      date: appointment.date,
      time: appointment.time,
      department: appointment.department,
      doctor: appointment.doctor,
      reason: appointment.reason,
      condition: appointment.reason,
      status: appointment.status,
      completed: appointment.completed,
      notes: appointment.notes,
      insuranceProvider: appointment.insuranceProvider,
      insuranceNumber: appointment.insuranceNumber,
      emergencyContact: appointment.emergencyContact,
      emergencyPhone: appointment.emergencyPhone
    }));
    
    res.json(transformedAppointments);
  } catch (error: any) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ error: 'Error fetching appointments', details: error.message });
  }
});

// Get appointment by ID
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if user has permission to view this appointment
    if (req.user?.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(appointment);
  } catch (error: any) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Error fetching appointment', details: error.message });
  }
});

// Create a new appointment
router.post('/', 
  auth,
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('time').notEmpty().withMessage('Time is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('doctor').trim().notEmpty().withMessage('Doctor is required'),
    body('reason').optional().trim(),
    body('notes').optional().trim(),
    body('insuranceProvider').optional().trim(),
    body('insuranceNumber').optional().trim(),
    body('emergencyContact').optional().trim(),
    body('emergencyPhone').optional().trim()
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const appointmentData = {
        ...req.body,
        patient: req.user?._id,
        status: 'scheduled',
        completed: false
      };

      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();
      
      // Populate patient data before sending response
      const populatedAppointment = await Appointment.findById(savedAppointment._id)
        .populate('patient', 'name email');
      
      res.status(201).json(populatedAppointment);
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ error: 'Error creating appointment', details: error.message });
    }
  }
);

// Update appointment status
router.patch('/:id/status', 
  auth,
  [
    body('status').isIn(['pending', 'confirmed', 'scheduled', 'completed', 'cancelled']).withMessage('Invalid status'),
    body('completed').optional().isBoolean().withMessage('Completed must be a boolean')
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, completed } = req.body;
      const appointment = await Appointment.findById(req.params.id);
      
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Check permissions: patients can only cancel their own appointments, doctors/admins can update any
      if (req.user?.role === 'patient') {
        if (appointment.patient.toString() !== req.user._id.toString()) {
          return res.status(403).json({ error: 'Access denied' });
        }
        if (status !== 'cancelled') {
          return res.status(403).json({ error: 'Patients can only cancel appointments' });
        }
      } else if (req.user?.role === 'doctor') {
        // Doctors can update appointments for their patients
        // Check if the doctor name matches the appointment doctor (case-insensitive)
        const appointmentDoctor = appointment.doctor?.toLowerCase().trim();
        const currentUserName = req.user.name?.toLowerCase().trim();
        
        console.log(`Doctor permission check:`);
        console.log(`- Appointment doctor: "${appointment.doctor}" (normalized: "${appointmentDoctor}")`);
        console.log(`- Current user: "${req.user.name}" (normalized: "${currentUserName}")`);
        
        if (appointmentDoctor !== currentUserName) {
          console.log(`Doctor name mismatch - access denied`);
          return res.status(403).json({ 
            error: 'You can only update appointments for your own patients',
            details: `Expected doctor: "${appointment.doctor}", Current user: "${req.user.name}"`
          });
        }
        console.log(`Doctor permission check passed`);
      }
      // Admins can update any appointment (no additional checks needed)

      // Log for debugging
      console.log(`Updating appointment ${req.params.id} from status ${appointment.status} to ${status}`);
      console.log(`User role: ${req.user?.role}, User ID: ${req.user?._id}`);
      console.log(`Appointment patient: ${appointment.patient}`);
      console.log(`Doctor name in appointment: ${appointment.doctor}`);
      console.log(`Current user name: ${req.user?.name}`);

      const updateData: any = { status };
      if (completed !== undefined) {
        updateData.completed = completed;
      }

      const updatedAppointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).populate('patient', 'name email');

      if (!updatedAppointment) {
        return res.status(404).json({ error: 'Appointment not found after update' });
      }

      // Transform to match frontend AppointmentData interface
      const transformedAppointment = {
        _id: updatedAppointment._id,
        patientId: (updatedAppointment.patient as any)?._id?.toString() || '',
        doctorId: (updatedAppointment.patient as any)?._id?.toString() || '', // Will be updated when doctor model is linked
        patientName: updatedAppointment.fullName,
        doctorName: updatedAppointment.doctor,
        fullName: updatedAppointment.fullName,
        email: updatedAppointment.email,
        phone: updatedAppointment.phone,
        patientEmail: updatedAppointment.email,
        patientPhone: updatedAppointment.phone,
        date: updatedAppointment.date,
        time: updatedAppointment.time,
        department: updatedAppointment.department,
        doctor: updatedAppointment.doctor,
        reason: updatedAppointment.reason,
        condition: updatedAppointment.reason,
        status: updatedAppointment.status,
        completed: updatedAppointment.completed,
        notes: updatedAppointment.notes,
        insuranceProvider: updatedAppointment.insuranceProvider,
        insuranceNumber: updatedAppointment.insuranceNumber,
        emergencyContact: updatedAppointment.emergencyContact,
        emergencyPhone: updatedAppointment.emergencyPhone
      };
      
      res.json(transformedAppointment);
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      res.status(500).json({ error: 'Error updating appointment', details: error.message });
    }
  }
);

// Update appointment details (doctors and admins only)
router.put('/:id', 
  auth,
  checkRole(['doctor', 'admin']),
  [
    body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please enter a valid email'),
    body('phone').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
    body('date').optional().notEmpty().withMessage('Date cannot be empty'),
    body('time').optional().notEmpty().withMessage('Time cannot be empty'),
    body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
    body('doctor').optional().trim().notEmpty().withMessage('Doctor cannot be empty'),
    body('reason').optional().trim(),
    body('notes').optional().trim(),
    body('insuranceProvider').optional().trim(),
    body('insuranceNumber').optional().trim(),
    body('emergencyContact').optional().trim(),
    body('emergencyPhone').optional().trim()
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const appointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('patient', 'name email');

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json(appointment);
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ error: 'Error updating appointment', details: error.message });
    }
  }
);

// Delete appointment (admins only)
router.delete('/:id', auth, checkRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Error deleting appointment', details: error.message });
  }
});

export default router;
