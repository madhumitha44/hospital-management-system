import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Phone, MapPin, Stethoscope, UserCog } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api.js';

export default function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    age: 0,
    gender: 'Male',
    phone: '',
    address: '',
    diagnosis: '',
    doctor: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadPatient();
    }
  }, [id]);

  const loadPatient = async () => {
    try {
      const patients = await api.getPatients();
      const patient = patients.find(p => p.id === id);
      if (patient) {
        setFormData({
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          phone: patient.phone,
          address: patient.address,
          diagnosis: patient.diagnosis,
          doctor: patient.doctor,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.updatePatient(id, formData);
      } else {
        await api.addPatient(formData);
      }
      navigate('/patients');
    } catch (err) {
      alert('Failed to save patient record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Dashboard</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            {isEdit ? 'Edit Patient Record' : 'New Patient Registration'}
          </h1>
          <p className="text-slate-500 mt-1">Please fill in all the required information below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Age */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Age</label>
              <input
                type="number"
                required
                min="0"
                max="150"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="25"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Home Address</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px]"
                placeholder="Enter full address..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Diagnosis */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Diagnosis / Disease</label>
              <div className="relative">
                <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g. Hypertension"
                />
              </div>
            </div>

            {/* Doctor */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Assigned Doctor</label>
              <div className="relative">
                <UserCog className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={formData.doctor}
                  onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Dr. Smith"
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : isEdit ? 'Update Record' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
