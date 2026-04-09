import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  diagnosis: { type: String, required: true },
  doctor: { type: String, required: true },
  admissionDate: { type: Date, default: Date.now }
});

const staffSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

export const PatientModel = mongoose.model('Patient', patientSchema);
export const StaffModel = mongoose.model('Staff', staffSchema);
