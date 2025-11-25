const express = require('express');
const cors = require('cors');
const path = require('path');
const { readData, writeData } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json()); // Native Express JSON parser

// Helper to simulate network latency for realism
const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

// --- API Routes (Prefix with /api) ---

app.post('/api/auth/login', async (req, res) => {
  await delay(300);
  const { email, password } = req.body;
  const db = readData();
  const user = db.users.find(u => u.email === email && u.password === password);

  if (user) {
    const { password, ...userWithoutPass } = user;
    res.json(userWithoutPass);
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// --- PATIENTS ---
app.get('/api/patients', async (req, res) => {
  await delay(200);
  const db = readData();
  res.json(db.patients || []);
});

app.post('/api/patients', async (req, res) => {
  await delay(200);
  const db = readData();
  if (!db.patients) db.patients = [];
  
  const newPatient = { ...req.body, id: Math.random().toString(36).substr(2, 9) };
  db.patients.push(newPatient);
  writeData(db);
  res.json(newPatient);
});

app.put('/api/patients/:id', async (req, res) => {
  await delay(200);
  const db = readData();
  const index = db.patients.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    db.patients[index] = { ...db.patients[index], ...req.body };
    writeData(db);
    res.json(db.patients[index]);
  } else {
    res.status(404).json({ error: 'Patient not found' });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  await delay(200);
  const db = readData();
  db.patients = db.patients.filter(p => p.id !== req.params.id);
  writeData(db);
  res.json({ success: true });
});

// --- APPOINTMENTS ---
app.get('/api/appointments', async (req, res) => {
  await delay(200);
  const db = readData();
  res.json(db.appointments || []);
});

app.post('/api/appointments', async (req, res) => {
  await delay(200);
  const db = readData();
  if (!db.appointments) db.appointments = [];

  const { appointment, cancelIds } = req.body; 

  // 1. Handle Cancels
  if (cancelIds && cancelIds.length > 0) {
    db.appointments = db.appointments.map(apt => 
      cancelIds.includes(apt.id) ? { ...apt, status: 'canceled' } : apt
    );
  }

  // 2. Handle Create or Update
  if (appointment.id) {
    const index = db.appointments.findIndex(a => a.id === appointment.id);
    if (index !== -1) {
      db.appointments[index] = { ...db.appointments[index], ...appointment };
    }
  } else {
    // Create
    const newApt = {
      ...appointment,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: appointment.status || 'pending'
    };
    db.appointments.push(newApt);
  }

  writeData(db);
  res.json(db.appointments);
});

app.put('/api/appointments/:id/restore', async (req, res) => {
  await delay(200);
  const db = readData();
  const index = db.appointments.findIndex(a => a.id === req.params.id);
  
  if (index !== -1) {
    db.appointments[index].status = 'pending';
    writeData(db);
    res.json(db.appointments);
  } else {
    res.status(404).json({ error: 'Appointment not found' });
  }
});

// --- INVOICES ---
app.get('/api/invoices', async (req, res) => {
  await delay(200);
  const db = readData();
  res.json(db.invoices || []);
});

app.post('/api/invoices', async (req, res) => {
  await delay(200);
  const db = readData();
  if (!db.invoices) db.invoices = [];
  
  const newInvoice = { ...req.body, id: Math.random().toString(36).substr(2, 9) };
  db.invoices.push(newInvoice);
  writeData(db);
  res.json(newInvoice);
});

app.put('/api/invoices/:id', async (req, res) => {
  await delay(200);
  const db = readData();
  if (!db.invoices) db.invoices = [];
  
  const index = db.invoices.findIndex(i => i.id === req.params.id);
  if (index !== -1) {
    db.invoices[index] = { ...db.invoices[index], ...req.body };
    writeData(db);
    res.json(db.invoices[index]);
  } else {
    res.status(404).json({ error: 'Invoice not found' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
});

// --- Production Static Serving ---
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'build');
  app.use(express.static(buildPath));

  // Handle React Routing, return all requests to React app
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(buildPath, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});