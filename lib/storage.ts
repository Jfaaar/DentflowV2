import { Appointment, User, Patient, Invoice, Radio } from "../types";

const KEYS = {
  USER: 'dentflow_user',
  APPOINTMENTS: 'dentflow_appointments',
  PATIENTS: 'dentflow_patients',
  LANGUAGE: 'dentflow_language',
  INVOICES: 'dentflow_invoices',
  RADIOS: 'dentflow_radios',
};

export const storage = {
  getUser: (): User | null => {
    try {
      const data = localStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  },
  setUser: (user: User) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },
  removeUser: () => {
    localStorage.removeItem(KEYS.USER);
  },
  
  // Language
  getLanguage: (): string => {
    return localStorage.getItem(KEYS.LANGUAGE) || 'en';
  },
  setLanguage: (lang: string) => {
    localStorage.setItem(KEYS.LANGUAGE, lang);
  },

  // Appointment Methods
  getAppointments: (): Appointment[] => {
    try {
      const data = localStorage.getItem(KEYS.APPOINTMENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },
  setAppointments: (appointments: Appointment[]) => {
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
  },
  addAppointment: (apt: Appointment) => {
    const current = storage.getAppointments();
    const updated = [...current, apt];
    storage.setAppointments(updated);
    return updated;
  },
  updateAppointment: (apt: Appointment) => {
    const current = storage.getAppointments();
    const updated = current.map(a => a.id === apt.id ? apt : a);
    storage.setAppointments(updated);
    return updated;
  },

  // Patient Methods
  getPatients: (): Patient[] => {
    try {
      const data = localStorage.getItem(KEYS.PATIENTS);
      if (!data) {
        // Seed mock data for MVP
        const mocks: Patient[] = [
          { id: 'p1', name: 'Sarah Connor', phone: '555-0199', email: 'sarah@example.com' },
          { id: 'p2', name: 'John Wick', phone: '555-0122', email: 'john@continental.com' },
          { id: 'p3', name: 'Ellen Ripley', phone: '555-0155' },
          { id: 'p4', name: 'Marty McFly', phone: '555-1985' },
        ];
        localStorage.setItem(KEYS.PATIENTS, JSON.stringify(mocks));
        return mocks;
      }
      return JSON.parse(data);
    } catch (e) { return []; }
  },
  addPatient: (patient: Patient) => {
    const current = storage.getPatients();
    const updated = [...current, patient];
    localStorage.setItem(KEYS.PATIENTS, JSON.stringify(updated));
    return updated;
  },
  updatePatient: (patient: Patient) => {
    const current = storage.getPatients();
    const updated = current.map(p => p.id === patient.id ? patient : p);
    localStorage.setItem(KEYS.PATIENTS, JSON.stringify(updated));
    return updated;
  },
  deletePatient: (id: string) => {
    const current = storage.getPatients();
    const updated = current.filter(p => p.id !== id);
    localStorage.setItem(KEYS.PATIENTS, JSON.stringify(updated));
    return updated;
  },

  // Invoice Methods
  getInvoices: (): Invoice[] => {
    try {
      const data = localStorage.getItem(KEYS.INVOICES);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },
  addInvoice: (invoice: Invoice) => {
    const current = storage.getInvoices();
    const updated = [...current, invoice];
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(updated));
    return updated;
  },
  updateInvoice: (invoice: Invoice) => {
    const current = storage.getInvoices();
    const updated = current.map(i => i.id === invoice.id ? invoice : i);
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(updated));
    return updated;
  },

  // Radio Methods
  getRadios: (): Radio[] => {
    try {
      const data = localStorage.getItem(KEYS.RADIOS);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },
  addRadio: (radio: Radio) => {
    const current = storage.getRadios();
    const updated = [radio, ...current];
    try {
        localStorage.setItem(KEYS.RADIOS, JSON.stringify(updated));
    } catch (e) {
        console.error("LocalStorage quota exceeded", e);
        throw new Error("Storage full");
    }
    return updated;
  },
  deleteRadio: (id: string) => {
    const current = storage.getRadios();
    const updated = current.filter(r => r.id !== id);
    localStorage.setItem(KEYS.RADIOS, JSON.stringify(updated));
    return updated;
  }
};