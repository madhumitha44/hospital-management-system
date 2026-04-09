import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Activity, Users, PlusCircle, LayoutDashboard } from 'lucide-react';
import { api } from '../services/api.js';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const staff = JSON.parse(localStorage.getItem('staff') || '{}');

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/patients', label: 'View Patients', icon: Users },
    { path: '/add-patient', label: 'Add Patient', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">MedRecord</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
              {staff.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">{staff.username}</p>
              <p className="text-xs text-slate-500">Hospital Staff</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
