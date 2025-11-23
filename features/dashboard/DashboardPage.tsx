import React, { useState, useEffect } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { Appointment } from '../../types';
import { formatDate, formatTime, isSameDay } from '../../lib/utils';
import { CalendarCheck, Clock, CheckCircle, User, Loader2, FileText, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../features/language/LanguageContext';

export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appointmentToValidate, setAppointmentToValidate] = useState<Appointment | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const fetchToday = async () => {
    setIsLoading(true);
    try {
      const all = await api.appointments.list();
      const today = new Date();
      const filtered = all
        .filter(a => isSameDay(new Date(a.start), today) && a.status !== 'canceled')
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      setTodayAppointments(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchToday();
  }, []);

  const initiateValidate = (apt: Appointment) => {
      setAppointmentToValidate(apt);
  };

  const confirmValidate = async () => {
      if (!appointmentToValidate) return;
      setIsValidating(true);
      try {
        await api.appointments.save({ ...appointmentToValidate, status: 'completed' });
        await fetchToday();
        setAppointmentToValidate(null);
      } catch (e) {
        alert("Failed to validate appointment");
      } finally {
        setIsValidating(false);
      }
  };

  return (
    <div className="flex flex-col h-full">
      <Topbar title={t('dashboard')} />
      
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg">
                <h2 className="text-2xl font-bold mb-2">Welcome Back, Doctor.</h2>
                <p className="opacity-90">You have {todayAppointments.filter(a => a.status === 'confirmed').length} consultations remaining today.</p>
            </div>

            <div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                    <CalendarCheck className="text-primary-600" />
                    {t('today')}'s Agenda
                </h3>

                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500"/></div>
                ) : todayAppointments.length === 0 ? (
                    <Card className="text-center py-12 text-surface-500">
                        <CalendarCheck size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No appointments scheduled for today.</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {todayAppointments.map(apt => (
                            <div 
                                key={apt.id} 
                                className={`bg-white dark:bg-surface-800 rounded-xl p-4 border shadow-sm transition-all flex flex-col md:flex-row md:items-center gap-4 ${
                                    apt.status === 'completed' ? 'border-purple-200 dark:border-purple-900/30 opacity-75' : 'border-surface-200 dark:border-surface-700'
                                }`}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                                        apt.status === 'completed' ? 'bg-purple-100 text-purple-600' : 'bg-primary-100 text-primary-600'
                                    }`}>
                                        {formatTime(apt.start)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-surface-900 dark:text-white text-lg">{apt.patientName}</h4>
                                        <div className="flex items-center gap-3 text-sm text-surface-500">
                                            <span className="flex items-center gap-1"><Clock size={14}/> {formatTime(apt.start)} - {formatTime(apt.end)}</span>
                                            {apt.observation && <span className="flex items-center gap-1"><FileText size={14}/> Note attached</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 justify-end">
                                    {apt.status === 'confirmed' && (
                                        <Button onClick={() => initiateValidate(apt)} className="gap-2 shadow-none bg-green-600 hover:bg-green-700">
                                            <CheckCircle size={18} />
                                            {t('validate')}
                                        </Button>
                                    )}
                                    {apt.status === 'completed' && (
                                        <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-bold border border-purple-100 dark:border-purple-800 flex items-center gap-2">
                                            <CheckCircle size={16} />
                                            {t('completed')}
                                        </div>
                                    )}
                                    {apt.status === 'pending' && (
                                        <div className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-medium border border-orange-100 dark:border-orange-800">
                                            {t('pending')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>

      <Modal
        isOpen={!!appointmentToValidate}
        onClose={() => setAppointmentToValidate(null)}
        title={t('validate')}
        maxWidth="sm"
      >
        <div className="text-center p-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
                <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">
                Validate Consultation?
            </h3>
            <p className="text-surface-500 dark:text-surface-400 mb-6">
                Mark appointment with <strong>{appointmentToValidate?.patientName}</strong> as completed?
                This will move it to the invoicing queue.
            </p>
            <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setAppointmentToValidate(null)}>Cancel</Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={confirmValidate} disabled={isValidating}>
                    {isValidating ? <Loader2 className="animate-spin" /> : 'Yes, Validate'}
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};