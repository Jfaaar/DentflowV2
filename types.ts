export type UserRole = 'admin' | 'assistant' | 'doctor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export type AppointmentStatus = 'confirmed' | 'pending' | 'canceled' | 'completed';

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profilePicture?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string; // Denormalized for MVP display
  start: string; // ISO Date String
  end: string; // ISO Date String
  status: AppointmentStatus;
  observation?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  amount: number;
  status: 'paid' | 'unpaid';
  date: string; // ISO Date String of issuance
}

export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

export interface DaySummary {
  date: Date;
  confirmed: number;
  pending: number;
  canceled: number;
  appointments: Appointment[];
}