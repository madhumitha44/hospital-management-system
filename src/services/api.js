const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  async login(username, password) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('staff', JSON.stringify(data.staff));
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('staff');
  },

  async getPatients() {
    const res = await fetch(`${API_BASE}/patients`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
  },

  async addPatient(patient) {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(patient),
    });
    if (!res.ok) throw new Error('Failed to add patient');
    return res.json();
  },

  async updatePatient(id, patient) {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(patient),
    });
    if (!res.ok) throw new Error('Failed to update patient');
    return res.json();
  },

  async deletePatient(id) {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete patient');
  },
};
