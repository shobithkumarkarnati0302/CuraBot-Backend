import { Response } from 'express';
import { Appointment } from '../models/Appointment.js';
import { AuthRequest } from '../middleware/auth.js';

// Get all appointments for the logged-in user
export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    // Find all appointments where the 'patient' field matches the logged-in user's ID
    const appointments = await Appointment.find({ patient: req.user._id })
      .sort({ date: 1 }); // Sort by the soonest date first

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
};

// Create a new appointment
export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    // The form data from your frontend comes in the request body
    const appointmentData = req.body;

    // Create a new appointment instance with the form data
    const newAppointment = new Appointment({
      ...appointmentData,
      patient: req.user._id, // Assign the appointment to the logged-in user
    });

    // Save the new appointment to the database
    await newAppointment.save();
    res.status(201).json(newAppointment);
  } catch (error) {
    res.status(400).json({ message: 'Error creating appointment', error });
  }
};

// Delete (cancel) an appointment
export const deleteAppointment = async (req: AuthRequest, res: Response) => {
    try {
        // Find the appointment by its ID AND ensure it belongs to the logged-in user
        const appointment = await Appointment.findOneAndDelete({ 
            _id: req.params.id, 
            patient: req.user._id 
        });

        if (!appointment) {
            // If no appointment is found, it's either the wrong ID or they don't have permission
            return res.status(404).json({ message: 'Appointment not found or you do not have permission to cancel it.' });
        }

        res.status(200).json({ message: 'Appointment cancelled successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling appointment', error });
    }
};
