const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

// In-Memory fallback if FS is not writable (common in cloud sandboxes)
let MEMORY_DB = null;
let USE_MEMORY = false;

const initialData = {
    users: [
      { id: 'u1', email: 'assistant@clinic.com', name: 'Dr. Assistant', role: 'assistant', password: 'password' }
    ],
    patients: [
        { id: 'p1', name: 'Sarah Connor', phone: '555-0199', email: 'sarah@example.com' },
        { id: 'p2', name: 'John Wick', phone: '555-0122', email: 'john@continental.com' }
    ],
    appointments: []
};

const initializeDB = () => {
    try {
        if (!fs.existsSync(DB_FILE)) {
            fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
        }
    } catch (err) {
        console.warn("Cannot write to DB file, switching to In-Memory DB mode.", err.message);
        USE_MEMORY = true;
        MEMORY_DB = JSON.parse(JSON.stringify(initialData));
    }
};

initializeDB();

const readData = () => {
  if (USE_MEMORY) return MEMORY_DB;
  
  try {
    if (!fs.existsSync(DB_FILE)) initializeDB();
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
  } catch (error) {
    console.error("DB Read Error", error);
    return initialData;
  }
};

const writeData = (data) => {
  if (USE_MEMORY) {
      MEMORY_DB = data;
      return;
  }

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("DB Write Error, switching to memory", error);
    USE_MEMORY = true;
    MEMORY_DB = data;
  }
};

module.exports = {
  readData,
  writeData
};