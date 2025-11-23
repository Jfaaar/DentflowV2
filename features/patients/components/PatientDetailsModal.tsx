import React, { useMemo, useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Patient, Appointment, Invoice } from '../../../types';
import { formatDate, formatTime, cn } from '../../../lib/utils';
import { Phone, Mail, Calendar, Clock, FileText, Pencil, History, ArrowUpRight, ArrowLeft, MessageCircle, Receipt, DollarSign, Maximize2, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  appointments: Appointment[];
  invoices: Invoice[];
  onEdit: (patient: Patient) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onBack?: () => void;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  isOpen,
  onClose,
  patient,
  appointments,
  invoices,
  onEdit,
  onEditAppointment,
  onBack
}) => {
  const [currentProfilePic, setCurrentProfilePic] = useState<string | undefined>(patient?.profilePicture);
  
  // Sub-modal states
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [showAllInvoices, setShowAllInvoices] = useState(false);

  // Update local state when patient changes
  React.useEffect(() => {
    setCurrentProfilePic(patient?.profilePicture);
    setShowAllAppointments(false);
    setShowAllInvoices(false);
  }, [patient]);

  const filteredAppointments = useMemo(() => {
    if (!patient) return { upcoming: [], past: [] };
    
    const patientAppts = appointments.filter(a => a.patientId === patient.id);
    const now = new Date();

    const upcoming = patientAppts
        .filter(a => new Date(a.start) >= now && a.status !== 'canceled')
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const past = patientAppts
        .filter(a => new Date(a.start) < now || a.status === 'canceled')
        .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

    return { upcoming, past };
  }, [patient, appointments, isOpen]);

  const filteredInvoices = useMemo(() => {
    if (!patient) return [];
    return invoices
      .filter(i => i.patientId === patient.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [patient, invoices]);

  const financialStats = useMemo(() => {
    const total = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const unpaid = filteredInvoices
        .filter(i => i.status === 'unpaid')
        .reduce((sum, inv) => sum + inv.amount, 0);
    return { total, unpaid };
  }, [filteredInvoices]);

  const openWhatsApp = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const renderAppointmentCard = (apt: Appointment) => (
    <div 
        key={apt.id} 
        onClick={() => {
            onEditAppointment(apt);
            // Close sub-modal if open to prevent stacking issues, or keep it. 
            // Keeping it open might be better UX, but modal-over-modal needs z-index handling.
            // For simple MVP, we let the Edit modal open on top.
        }}
        className="group bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-3 shadow-sm hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-md transition-all border-l-4 border-l-primary-500 cursor-pointer relative"
    >
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary-500">
            <ArrowUpRight size={16} />
        </div>

        <div className="flex justify-between items-start mb-1">
            <div className="font-semibold text-surface-900 dark:text-white">
                {formatDate(new Date(apt.start))}
            </div>
            <div className={cn(
                "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold mr-6",
                apt.status === 'confirmed' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
            )}>
                {apt.status}
            </div>
        </div>
        <div className="text-sm text-surface-600 dark:text-surface-400 flex items-center gap-1.5 mb-2">
            <Clock size={14} />
            {formatTime(apt.start)} - {formatTime(apt.end)}
        </div>
        {apt.observation && (
            <div className="bg-surface-50 dark:bg-surface-900/50 p-2 rounded-lg text-xs text-surface-600 dark:text-surface-400 italic flex gap-2 items-start">
                <FileText size={12} className="mt-0.5 shrink-0 opacity-50" />
                {apt.observation}
            </div>
        )}
    </div>
  );

  const renderHistoryCard = (apt: Appointment) => (
    <div key={apt.id} className="bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-xl p-3 opacity-80 hover:opacity-100 transition-opacity">
        <div className="flex justify-between items-start mb-1">
            <div className="font-medium text-surface-700 dark:text-surface-300">
                {formatDate(new Date(apt.start))}
            </div>
            <div className={cn(
                "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold",
                apt.status === 'canceled' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : 
                apt.status === 'completed' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                "bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-400"
            )}>
                {apt.status}
            </div>
        </div>
        <div className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1.5">
            <Clock size={12} />
            {formatTime(apt.start)} - {formatTime(apt.end)}
        </div>
    </div>
  );

  const renderInvoiceCard = (inv: Invoice) => (
    <div key={inv.id} className="bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-xl p-3">
        <div className="flex justify-between items-center mb-1">
            <div className="font-bold text-surface-900 dark:text-white flex items-center gap-1">
                <DollarSign size={12} className="text-surface-400"/>
                {inv.amount.toFixed(2)}
            </div>
            <div className={cn(
                "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold",
                inv.status === 'paid' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
                {inv.status}
            </div>
        </div>
        <div className="text-xs text-surface-500 dark:text-surface-400">
            {formatDate(new Date(inv.date))}
        </div>
    </div>
  );

  if (!patient) return null;

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Patient Profile"
      maxWidth="3xl"
    >
      <div className="flex flex-col gap-6 h-[80vh] md:h-auto">
        
        {/* Header Profile Card */}
        <div className="bg-surface-50 dark:bg-surface-800/50 p-6 rounded-2xl border border-surface-100 dark:border-surface-700 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none" />

            <div className="flex items-center gap-4">
                {onBack && (
                    <button 
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-500 dark:text-surface-400 transition-colors"
                        title="Back to Directory"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0 shadow-sm ring-4 ring-white dark:ring-surface-800 overflow-hidden">
                        {currentProfilePic ? (
                            <img src={currentProfilePic} alt={patient.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl font-bold">{patient.name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white">{patient.name}</h2>
                        <div className="flex flex-col gap-1 mt-1.5">
                            <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                                <Phone size={14} className="text-primary-500" /> 
                                <span>{patient.phone}</span>
                                <button
                                    onClick={(e) => openWhatsApp(e, patient.phone)}
                                    className="ml-1 p-1 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                                    title="Chat on WhatsApp"
                                >
                                    <MessageCircle size={16} />
                                </button>
                            </div>
                            {patient.email && (
                                <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                                    <Mail size={14} className="text-primary-500" /> 
                                    <span>{patient.email}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => {
                        onEdit(patient);
                        onClose();
                    }} className="gap-2 shrink-0 w-full sm:w-auto">
                        <Pencil size={14} /> Edit Profile
                    </Button>
                </div>
            </div>
        </div>

        {/* Main Content Summary */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 px-1 pb-2">
            
            {/* Appointments Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-1 right-0 text-surface-400 hover:text-primary-600 z-10"
                    onClick={() => setShowAllAppointments(true)}
                    title="View Full History"
                 >
                    <Maximize2 size={16} />
                 </Button>

                {/* Upcoming */}
                <div className="flex flex-col">
                    <h3 className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Calendar size={14} className="text-primary-500"/>
                        Upcoming (Preview)
                    </h3>
                    <div className="space-y-3">
                        {filteredAppointments.upcoming.length > 0 ? (
                            filteredAppointments.upcoming.slice(0, 3).map(renderAppointmentCard)
                        ) : (
                            <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-6 text-center text-surface-400 border border-dashed border-surface-200 dark:border-surface-700">
                                <p className="text-sm">No upcoming appointments</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* History */}
                <div className="flex flex-col">
                    <h3 className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <History size={14} className="text-surface-400"/>
                        Recent History (Preview)
                    </h3>
                    <div className="space-y-3">
                        {filteredAppointments.past.length > 0 ? (
                            filteredAppointments.past.slice(0, 3).map(renderHistoryCard)
                        ) : (
                            <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-6 text-center text-surface-400 border border-dashed border-surface-200 dark:border-surface-700">
                                <p className="text-sm">No history available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Financials Row */}
            <div className="flex flex-col relative">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-1 right-0 text-surface-400 hover:text-primary-600 z-10"
                    onClick={() => setShowAllInvoices(true)}
                    title="View All Invoices"
                 >
                    <Maximize2 size={16} />
                 </Button>

                <div className="flex items-center justify-between mb-3 pr-8">
                    <h3 className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider flex items-center gap-2">
                        <Receipt size={14} className="text-surface-400"/>
                        Financials (Preview)
                    </h3>
                    {financialStats.unpaid > 0 && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">
                            Due: ${financialStats.unpaid}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredInvoices.length > 0 ? (
                        filteredInvoices.slice(0, 3).map(renderInvoiceCard)
                    ) : (
                        <div className="col-span-full bg-surface-50 dark:bg-surface-800/50 rounded-xl p-6 text-center text-surface-400 border border-dashed border-surface-200 dark:border-surface-700">
                            <p className="text-sm">No invoices found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-surface-100 dark:border-surface-800 flex justify-end items-center">
            <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>

    {/* SUB-MODAL: Appointments Full History */}
    <Modal
        isOpen={showAllAppointments}
        onClose={() => setShowAllAppointments(false)}
        title="Full Appointment History"
        maxWidth="4xl"
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[70vh]">
            <div className="flex flex-col h-full overflow-hidden">
                <h3 className="text-sm font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 p-2 rounded-lg mb-3">
                    Upcoming ({filteredAppointments.upcoming.length})
                </h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-2">
                    {filteredAppointments.upcoming.map(renderAppointmentCard)}
                    {filteredAppointments.upcoming.length === 0 && <p className="text-center text-surface-400 text-sm mt-10">No upcoming appointments.</p>}
                </div>
            </div>
            <div className="flex flex-col h-full overflow-hidden">
                <h3 className="text-sm font-bold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 p-2 rounded-lg mb-3">
                    Past History ({filteredAppointments.past.length})
                </h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-2">
                    {filteredAppointments.past.map(renderHistoryCard)}
                    {filteredAppointments.past.length === 0 && <p className="text-center text-surface-400 text-sm mt-10">No past history.</p>}
                </div>
            </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-800 mt-2">
            <Button variant="ghost" onClick={() => setShowAllAppointments(false)}>Close</Button>
        </div>
    </Modal>

    {/* SUB-MODAL: Financials Full History */}
    <Modal
        isOpen={showAllInvoices}
        onClose={() => setShowAllInvoices(false)}
        title="Full Invoice History"
        maxWidth="3xl"
    >
        <div className="flex flex-col h-[70vh]">
            <div className="flex justify-between items-center mb-4 bg-surface-50 dark:bg-surface-800 p-3 rounded-xl border border-surface-200 dark:border-surface-700">
                <div className="text-sm font-medium text-surface-600 dark:text-surface-400">Total Invoiced: <span className="text-surface-900 dark:text-white font-bold">${financialStats.total.toFixed(2)}</span></div>
                <div className="text-sm font-medium text-red-600 dark:text-red-400">Total Due: <span className="font-bold">${financialStats.unpaid.toFixed(2)}</span></div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                 {filteredInvoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 p-4 rounded-xl shadow-sm">
                         <div>
                            <div className="font-bold text-lg text-surface-900 dark:text-white">${inv.amount.toFixed(2)}</div>
                            <div className="text-xs text-surface-500">{formatDate(new Date(inv.date))}</div>
                         </div>
                         <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold uppercase",
                            inv.status === 'paid' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                            {inv.status}
                        </span>
                    </div>
                 ))}
                 {filteredInvoices.length === 0 && <p className="text-center text-surface-400 text-sm mt-10">No invoices found.</p>}
            </div>
        </div>
         <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-800 mt-2">
            <Button variant="ghost" onClick={() => setShowAllInvoices(false)}>Close</Button>
        </div>
    </Modal>
    </>
  );
};