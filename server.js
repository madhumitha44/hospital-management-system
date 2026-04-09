import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { PatientModel, StaffModel } from './src/models/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SECRET = process.env.JWT_SECRET || 'hospital-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // MongoDB Connection
  let isMongoConnected = false;
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
    });
    isMongoConnected = true;
    console.log('Connected to MongoDB');

    // Create default admin if not exists
    const adminExists = await StaffModel.findOne({ username: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await StaffModel.create({ username: 'admin', password: hashedPassword });
      console.log('Default admin created in MongoDB');
    }
  } catch (err) {
    console.warn('MongoDB connection failed. Falling back to local JSON storage.', err instanceof Error ? err.message : '');
    isMongoConnected = false;
  }

  // Local JSON Fallback Setup
  const DB_PATH = path.join(__dirname, 'db.json');
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      patients: [],
      staff: [{ id: '1', username: 'admin', password: await bcrypt.hash('password123', 10) }]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
  }

  const readLocalDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  const writeLocalDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

  // Auth Middleware
  const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, SECRET);
      req.staff = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // --- API Routes ---

  // Login
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      if (isMongoConnected) {
        const staff = await StaffModel.findOne({ username });
        if (staff && (await bcrypt.compare(password, staff.password))) {
          const token = jwt.sign({ id: staff._id, username: staff.username }, SECRET, { expiresIn: '1d' });
          return res.json({ token, staff: { id: staff._id, username: staff.username } });
        }
      }

      // Fallback to local DB for login
      const localDB = readLocalDB();
      const localStaff = localDB.staff.find((s) => s.username === username);
      if (localStaff && (await bcrypt.compare(password, localStaff.password))) {
        const token = jwt.sign({ id: localStaff.id, username: localStaff.username }, SECRET, { expiresIn: '1d' });
        return res.json({ token, staff: { id: localStaff.id, username: localStaff.username } });
      }

      res.status(401).json({ error: 'Invalid credentials' });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get DB Status
  app.get('/api/db-status', authenticate, (req, res) => {
    res.json({ status: isMongoConnected ? 'connected' : 'fallback' });
  });

  // Get all patients
  app.get('/api/patients', authenticate, async (req, res) => {
    try {
      if (isMongoConnected) {
        const patients = await PatientModel.find();
        return res.json(patients.map(p => ({ ...p.toObject(), id: p._id })));
      }
      
      const localDB = readLocalDB();
      res.json(localDB.patients);
    } catch (err) {
      console.error('Fetch error:', err);
      res.status(500).json({ error: 'Failed to fetch patients. Please check database connection.' });
    }
  });

  // Add patient
  app.post('/api/patients', authenticate, async (req, res) => {
    try {
      if (isMongoConnected) {
        const newPatient = await PatientModel.create(req.body);
        return res.status(201).json({ ...newPatient.toObject(), id: newPatient._id });
      }

      const localDB = readLocalDB();
      const newPatient = {
        ...req.body,
        id: `PAT-${Date.now()}`,
        admissionDate: new Date().toISOString()
      };
      localDB.patients.push(newPatient);
      writeLocalDB(localDB);
      res.status(201).json(newPatient);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add patient' });
    }
  });

  // Update patient
  app.put('/api/patients/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
      if (isMongoConnected && mongoose.Types.ObjectId.isValid(id)) {
        const updatedPatient = await PatientModel.findByIdAndUpdate(id, req.body, { new: true });
        if (updatedPatient) return res.json({ ...updatedPatient.toObject(), id: updatedPatient._id });
      }

      const localDB = readLocalDB();
      const index = localDB.patients.findIndex((p) => p.id === id);
      if (index === -1) return res.status(404).json({ error: 'Patient not found' });

      localDB.patients[index] = { ...localDB.patients[index], ...req.body };
      writeLocalDB(localDB);
      res.json(localDB.patients[index]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update patient' });
    }
  });

  // Delete patient
  app.delete('/api/patients/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
      if (isMongoConnected && mongoose.Types.ObjectId.isValid(id)) {
        const deletedPatient = await PatientModel.findByIdAndDelete(id);
        if (deletedPatient) return res.status(204).send();
      }

      const localDB = readLocalDB();
      const initialLength = localDB.patients.length;
      localDB.patients = localDB.patients.filter((p) => p.id !== id);
      
      if (localDB.patients.length === initialLength && !isMongoConnected) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      writeLocalDB(localDB);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete patient' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Explicitly serve index.html for the SPA
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        // Transform index.html to include Vite's client script and correct paths
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
