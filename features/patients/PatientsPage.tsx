import React, { useState, useEffect, useMemo } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { api } from '../../lib/api';
import { Patient, Appointment, Invoice } from '../../types';
import { Search, UserPlus, Pencil, Trash2, Phone, Mail, FileText, Eye, Loader2, MessageCircle } from 'lucide-react';
import { PatientFormModal } from './components/PatientFormModal';
import { PatientDetailsModal } from './components/PatientDetailsModal';
import { AppointmentModal } from '../appointments/AppointmentModal';
import { useLanguage } from '../language/LanguageContext';

export const PatientsPage: React.FC = () => {
  const { t } = useLanguage();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | undefined>(undefined);

  const refreshData = async () => {
    try {
        const [pats, appts, invs] = await Promise.all([
            api.patients.list(),
            api.appointments.list(),
            api.invoices.list()
        ]);
        setPatients(pats);
        setAppointments(appts);
        setInvoices(invs);
    } catch (e) {
        console.error("Failed to load data", e);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;
    const lower = searchQuery.toLowerCase();
    return patients.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.phone.includes(lower) || 
      (p.email && p.email.toLowerCase().includes(lower))
    );
  }, [patients, searchQuery]);

  const handleSavePatient = async (patient: Patient) => {
    setIsLoading(true);
    try {
        if (editingPatient) {
            await api.patients.update(patient);
        } else {
            await api.patients.create(patient);
        }
        await refreshData();
    } catch (e) {
        alert("Failed to save patient");
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeletePatient = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      setIsLoading(true);
      await api.patients.delete(id);
      await refreshData();
      if (viewingPatient?.id === id) setViewingPatient(null);
    }
  };

  const handleEditAppointment = (apt: Appointment) => {
    setEditingAppt(apt);
    setIsAppointmentModalOpen(true);
  };

  const handleSaveAppointment = async (data: Partial<Appointment>, appointmentsToCancel: string[] = []) => {
    setIsLoading(true);
    try {
        await api.appointments.save(data, appointmentsToCancel);
        await refreshData();
        setIsAppointmentModalOpen(false);
    } catch (e) {
        alert("Failed to save appointment");
    } finally {
        setIsLoading(false);
    }
  };

  const openNewPatient = () => {
    setEditingPatient(undefined);
    setIsFormOpen(true);
  };

  const openEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setIsFormOpen(true);
  };

  const openWhatsApp = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full">
      <Topbar title={t('patientDirectory')}>
        {isLoading && <span className="text-xs text-surface-400 flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1"/> {t('updating')}</span>}
      </Topbar>

      <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
            <input 
              type="text"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface-800 shadow-sm transition-all"
              placeholder={t('searchPatientsPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={openNewPatient} className="gap-2 w-full sm:w-auto shadow-lg shadow-primary-200 dark:shadow-none">
            <UserPlus size={18} />
            {t('addPatient')}
          </Button>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden border-surface-200 dark:border-surface-700 shadow-sm" noPadding>
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-50 dark:bg-surface-800 sticky top-0 z-10 border-b border-surface-200 dark:border-surface-700">
                <tr>
                  <th className="py-4 px-4 md:px-6 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{t('fullName')}</th>
                  <th className="py-4 px-4 md:px-6 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider hidden md:table-cell">{t('contactInfo')}</th>
                  <th className="py-4 px-4 md:px-6 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                {isLoading && filteredPatients.length === 0 ? (
                    <tr>
                        <td colSpan={3} className="py-12 text-center text-surface-400">
                            <div className="flex items-center justify-center"><Loader2 className="animate-spin mr-2"/> {t('loading')}</div>
                        </td>
                    </tr>
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <tr 
                      key={patient.id} 
                      onClick={() => setViewingPatient(patient)}
                      className="group hover:bg-surface-50/80 dark:hover:bg-surface-800 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold shadow-sm shrink-0">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-surface-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors truncate">
                              {patient.name}
                            </div>
                            <div className="md:hidden text-xs text-surface-500 dark:text-surface-400 mt-1 flex items-center gap-2">
                                <Phone size={12}/> {patient.phone}
                            </div>
                            <div className="hidden md:block text-xs text-surface-400">ID: {patient.id.slice(0, 6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6 hidden md:table-cell">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
                            <Phone size={14} className="text-surface-400" />
                            <span>{patient.phone}</span>
                            <button
                                onClick={(e) => openWhatsApp(e, patient.phone)}
                                className="ml-1 p-1 text-surface-300 hover:text-green-600 transition-colors"
                                title="Chat on WhatsApp"
                            >
                                <MessageCircle size={14} />
                            </button>
                          </div>
                          {patient.email && (
                            <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
                              <Mail size={14} className="text-surface-400" />
                              <span className="truncate max-w-[200px]">{patient.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setViewingPatient(patient);
                            }}
                            className="p-2 text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all md:hidden"
                            title="View Profile"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                openEditPatient(patient);
                            }}
                            className="p-2 text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all hidden md:block opacity-0 group-hover:opacity-100"
                            title="Edit Details"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={(e) => handleDeletePatient(patient.id, e)}
                            className="p-2 text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all hidden md:block opacity-0 group-hover:opacity-100"
                            title="Delete Record"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-surface-400">
                        <div className="flex flex-col items-center justify-center">
                            <FileText size={48} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium text-surface-500">{t('noPatientsFound')}</p>
                            <p className="text-sm">{t('searchOrAddPatient')}</p>
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-surface-200 dark:border-surface-700 p-4 bg-surface-50 dark:bg-surface-800 text-xs text-surface-500 flex justify-between items-center">
             <span>{t('showingRecords').replace('{count}', filteredPatients.length.toString())}</span>
             <span className="italic hidden sm:inline">{t('clickRowToView')}</span>
          </div>
        </Card>
      </div>

      <PatientFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSavePatient}
        initialData={editingPatient}
      />

      <PatientDetailsModal
        isOpen={!!viewingPatient}
        onClose={() => setViewingPatient(null)}
        patient={viewingPatient}
        appointments={appointments}
        invoices={invoices}
        onEdit={openEditPatient}
        onEditAppointment={handleEditAppointment}
      />

      {isAppointmentModalOpen && (
        <AppointmentModal
            isOpen={isAppointmentModalOpen}
            onClose={() => setIsAppointmentModalOpen(false)}
            onSubmit={handleSaveAppointment}
            initialAppointment={editingAppt}
            existingAppointments={appointments}
        />
      )}
    </div>
  );
};