import { Appointment, Patient, User, Invoice } from "../types";
import { storage } from "./storage";

// Helper to simulate network latency for a realistic UX (spinners, etc.)
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  auth: {
    login: async (credentials: any): Promise<User> => {
        await delay(600);
        
        // Simple Local Auth: Accept specific credentials or any non-empty input for demo
        if (credentials.email === 'demo' && credentials.password === 'demo') {
            const user: User = { id:'u1', name:'Demo Doctor', email: credentials.email, role: 'doctor'};
            storage.setUser(user);
            return user;
        }

        if (credentials.email === 'assistant@clinic.com' && credentials.password === 'password') {
            const user: User = { id:'u2', name:'Dr. Assistant', email: credentials.email, role: 'assistant'};
            storage.setUser(user);
            return user;
        }
        
        throw new Error('Invalid credentials');
    }
  },
  patients: {
    list: async (): Promise<Patient[]> => {
        await delay();
        return storage.getPatients();
    },
    create: async (patient: Patient): Promise<Patient> => {
        await delay();
        const newPatient = { ...patient, id: Math.random().toString(36).substr(2, 9) };
        storage.addPatient(newPatient);
        return newPatient;
    },
    update: async (patient: Patient): Promise<Patient> => {
        await delay();
        storage.updatePatient(patient);
        return patient;
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
        await delay();
        storage.deletePatient(id);
        return { success: true };
    }
  },
  appointments: {
    list: async (): Promise<Appointment[]> => {
        await delay();
        return storage.getAppointments();
    },
    save: async (appointment: Partial<Appointment>, cancelIds: string[] = []): Promise<Appointment[]> => {
        await delay();
        let current = storage.getAppointments();

        // 1. Handle Cancellations (overwriting pending slots)
        if (cancelIds.length > 0) {
            current = current.map(a => cancelIds.includes(a.id) ? { ...a, status: 'canceled' as const } : a);
        }

        // 2. Handle Create or Update
        if (appointment.id) {
            // Update existing
            current = current.map(a => 
                a.id === appointment.id ? { ...a, ...appointment } as Appointment : a
            );
        } else {
            // Create new
            const newApt: Appointment = {
                ...appointment,
                id: Math.random().toString(36).substr(2, 9),
                createdAt: new Date().toISOString(),
                status: appointment.status || 'pending'
            } as Appointment;
            current.push(newApt);
        }

        storage.setAppointments(current);
        return current;
    },
    restore: async (id: string): Promise<Appointment[]> => {
        await delay();
        const current = storage.getAppointments().map(a => 
            a.id === id ? { ...a, status: 'pending' as const } : a
        );
        storage.setAppointments(current);
        return current;
    }
  },
  invoices: {
    list: async (): Promise<Invoice[]> => {
        await delay();
        return storage.getInvoices();
    },
    create: async (invoice: Omit<Invoice, 'id'>): Promise<Invoice> => {
        await delay();
        const newInvoice = { ...invoice, id: Math.random().toString(36).substr(2, 9) };
        storage.addInvoice(newInvoice);
        return newInvoice;
    },
    update: async (invoice: Invoice): Promise<Invoice> => {
        await delay();
        storage.updateInvoice(invoice);
        return invoice;
    }
  }
};