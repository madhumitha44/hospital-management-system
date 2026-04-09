import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Edit2, Trash2, Filter, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api.js';

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [dbStatus, setDbStatus] = useState('fallback');

  useEffect(() => {
    loadPatients();
    checkDbStatus();
  }, []);

  const checkDbStatus = async () => {
    try {
      const response = await fetch('/api/db-status', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setDbStatus(data.status);
    } catch (err) {
      setDbStatus('fallback');
    }
  };

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient record?')) return;
    try {
      await api.deletePatient(id);
      setPatients(patients.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete patient');
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-800">Patient Dashboard</h1>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              dbStatus === 'connected' 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                : 'bg-amber-50 text-amber-600 border border-amber-100'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              {dbStatus === 'connected' ? 'MongoDB Connected' : 'Local Storage (Fallback)'}
            </div>
          </div>
          <p className="text-slate-500 mt-1">Manage and monitor patient records</p>
        </div>
        <Link
          to="/add-patient"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <UserPlus className="w-5 h-5" />
          Add New Patient
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Patients', value: patients.length, color: 'blue' },
          { label: 'Admitted Today', value: patients.filter(p => p.admissionDate === new Date().toISOString().split('T')[0]).length, color: 'emerald' },
          { label: 'Critical Cases', value: patients.filter(p => p.diagnosis.toLowerCase().includes('critical')).length, color: 'rose' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <p className={`text-4xl font-bold mt-2 text-${stat.color}-600`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, ID, or diagnosis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <button className="flex items-center gap-2 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors">
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filter</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Patient Info</th>
                <th className="px-6 py-4">Diagnosis</th>
                <th className="px-6 py-4">Assigned Doctor</th>
                <th className="px-6 py-4">Admission</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-8 bg-slate-50/20" />
                    </tr>
                  ))
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                      No patient records found.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                    <motion.tr
                      key={patient.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            {patient.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{patient.name}</p>
                            <p className="text-xs text-slate-500">ID: {patient.id} • {patient.age}y, {patient.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                          {patient.diagnosis}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        Dr. {patient.doctor}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(patient.admissionDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/edit-patient/${patient.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(patient.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
