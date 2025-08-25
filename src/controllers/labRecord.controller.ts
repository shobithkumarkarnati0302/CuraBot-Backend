import { Response } from 'express';
import { LabRecord } from '../models/LabRecords.js';
import { AuthRequest } from '../middleware/auth.js';

// Gets lab records ONLY for the currently logged-in user
export const getLabRecords = async (req: AuthRequest, res: Response) => {
  try {
    const records = await LabRecord.find({ patient: req.user._id }).sort({ date: 1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lab records', error });
  }
};

// Creates a new lab record FOR the currently logged-in user
export const createLabRecord = async (req: AuthRequest, res: Response) => {
  try {
    // We get the patient ID from the logged-in user's token
    const patientId = req.user._id;
    
    // The form data comes from the request
    const { testName, date, doctor, category, status, result } = req.body;
    
    const newRecord = new LabRecord({
      testName,
      date,
      doctor, // We will save the doctor's name as a simple string for now
      category,
      status,
      result,
      patient: patientId, // Assign the record to the logged-in user
    });

    await newRecord.save();
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(400).json({ message: 'Error creating lab record', error });
  }
};

// Deletes a lab record belonging to the logged-in user
export const deleteLabRecord = async (req: AuthRequest, res: Response) => {
    try {
        const record = await LabRecord.findOneAndDelete({ _id: req.params.id, patient: req.user._id });
        if (!record) {
            return res.status(404).json({ message: 'Record not found.' });
        }
        res.status(200).json({ message: 'Lab record deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting lab record', error });
    }
};