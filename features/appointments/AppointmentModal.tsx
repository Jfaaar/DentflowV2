import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Appointment, AppointmentStatus, Patient } from '../../types';
import { cn } from '../../lib/utils';
import { Clock, Calendar as CalendarIcon, User, Phone, Search, X, Lock, FileText, Activity, BookUser, Trash2, AlertTriangle, MessageCircle, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { PatientDirectoryModal } from '../patients/PatientDirectoryModal';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Appointment>, appointmentsToCancel?: string[]) => void;
  initialDate?: Date;
  initialAppointment?: Appointment;
  existingAppointments: Appointment[];
}

const START_HOUR = 8;
const END_HOUR = 18;

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  initialAppointment,
  existingAppointments
}) => {
  // --- State ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [status, setStatus] = useState<AppointmentStatus>('pending');
  const [observation, setObservation] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingConflictIds, setPendingConflictIds] = useState<string[] | null>(null);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  useEffect(() => {
    if (isOpen) {
      api.patients.list().then(setPatients);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && patients.length > 0) {
      if (initialAppointment) {
        const foundPatient = patients.find(p => p.id === initialAppointment.patientId);
        if (foundPatient) setSelectedPatient(foundPatient);
        else if (initialAppointment.patientName) {
             setSelectedPatient({ id: initialAppointment.patientId, name: initialAppointment.patientName, phone: 'Unknown' });
        }
        setStatus(initialAppointment.status);
        setObservation(initialAppointment.observation || '');
        
        const startObj = new Date(initialAppointment.start);
        const endObj = new Date(initialAppointment.end);
        setSelectedDate(startObj.toISOString().split('T')[0]);
        
        const slots = [];
        let current = new Date(startObj);
        while (current < endObj) {
          const timeStr = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          if (timeSlots.includes(timeStr)) slots.push(timeStr);
          current.setMinutes(current.getMinutes() + 30);
        }
        setSelectedSlots(slots);
      } else {
        resetForm();
        if (initialDate) {
            const offset = initialDate.getTimezoneOffset(); 
            const localDate = new Date(initialDate.getTime() - (offset*60*1000));
            setSelectedDate(localDate.toISOString().split('T')[0]);
            const h = initialDate.getHours();
            const m = initialDate.getMinutes();
            if (h >= START_HOUR && h < END_HOUR) {
                const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                setSelectedSlots([timeStr]);
            }
        }
      }
    }
  }, [isOpen, initialAppointment, initialDate, patients]);

  const resetForm = () => {
    setSelectedPatient(null);
    setSearchQuery('');
    setStatus('pending');
    setObservation('');
    setSelectedSlots([]);
    setShowCancelConfirm(false);
    setPendingConflictIds(null);
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return [];
    const lower = searchQuery.toLowerCase();
    return patients.filter(p => p.name.toLowerCase().includes(lower) || p.phone.includes(lower));
  }, [patients, searchQuery]);

  const checkSlotStatus = (dateStr: string, timeStr: string) => {
    if (!dateStr) return { status: 'free' as const };
    const slotStart = new Date(`${dateStr}T${timeStr}`);
    const slotEnd = new Date(slotStart.getTime() + 30 * 60000); 

    const conflict = existingAppointments.find(apt => {
        if (apt.status === 'canceled') return false;
        if (initialAppointment && apt.id === initialAppointment.id) return false;
        const aptStart = new Date(apt.start);
        const aptEnd = new Date(apt.end);
        return (aptStart < slotEnd && aptEnd > slotStart);
    });

    if (!conflict) return { status: 'free' as const };
    return { status: conflict.status, appointment: conflict };
  };

  const toggleSlot = (slot: string) => {
    const { status: slotStatus } = checkSlotStatus(selectedDate, slot);
    if (slotStatus === 'confirmed' || slotStatus === 'completed') return;
    if (selectedSlots.includes(slot)) {
      setSelectedSlots([]);
      return;
    }

    if (selectedSlots.length > 0) {
      const allSlots = timeSlots; 
      const sortedCurrent = [...selectedSlots].sort();
      const startSlot = sortedCurrent[0];
      const endSlot = sortedCurrent[sortedCurrent.length - 1];
      const clickedIndex = allSlots.indexOf(slot);
      const startIndex = allSlots.indexOf(startSlot);
      const endIndex = allSlots.indexOf(endSlot);
      const rangeStartIdx = Math.min(clickedIndex, startIndex);
      const rangeEndIdx = Math.max(clickedIndex, endIndex);
      const candidateRange = allSlots.slice(rangeStartIdx, rangeEndIdx + 1);

      const hasConfirmedConflict = candidateRange.some(s => {
        const { status } = checkSlotStatus(selectedDate, s);
        return status === 'confirmed' || status === 'completed';
      });

      if (hasConfirmedConflict) {
        alert("Cannot select a range that overlaps with Confirmed or Completed appointments.");
        return;
      }
      setSelectedSlots(candidateRange);
    } else {
      setSelectedSlots([slot]);
    }
  };

  const openWhatsApp = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const statusTheme = {
    confirmed: {
      active: 'bg-green-100 text-green-800 ring-1 ring-green-500 shadow-sm dark:bg-green-900/40 dark:text-green-300 dark:ring-green-500/50',
      inactive: 'text-green-600 hover:bg-green-50 hover:text-green-800 dark:text-green-400 dark:hover:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      focusRing: 'focus:ring-green-500 focus:border-green-500'
    },
    pending: {
      active: 'bg-orange-100 text-orange-800 ring-1 ring-orange-500 shadow-sm dark:bg-orange-900/40 dark:text-orange-300 dark:ring-orange-500/50',
      inactive: 'text-orange-600 hover:bg-orange-50 hover:text-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20',
      icon: 'text-orange-600 dark:text-orange-400',
      focusRing: 'focus:ring-orange-500 focus:border-orange-500'
    },
    completed: {
      active: 'bg-purple-100 text-purple-800 ring-1 ring-purple-500 shadow-sm dark:bg-purple-900/40 dark:text-purple-300 dark:ring-purple-500/50',
      inactive: 'text-purple-600 hover:bg-purple-50 hover:text-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      focusRing: 'focus:ring-purple-500 focus:border-purple-500'
    },
    canceled: { active: '', inactive: '', icon: '', focusRing: '' }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSlots.length === 0 || !selectedPatient) {
        alert("Please select slots and a patient.");
        return;
    }

    const touchedPendingApps = new Set<string>();
    for (const slot of selectedSlots) {
        const { status, appointment } = checkSlotStatus(selectedDate, slot);
        if (status === 'pending' && appointment) touchedPendingApps.add(appointment.id);
    }

    if (touchedPendingApps.size > 0) {
        setPendingConflictIds(Array.from(touchedPendingApps));
        return;
    }
    submitFinal([]);
  };

  const submitFinal = (conflictingIds: string[] = []) => {
    const sortedSlots = [...selectedSlots].sort();
    const startDateTime = new Date(`${selectedDate}T${sortedSlots[0]}`);
    const endDateTime = new Date(`${selectedDate}T${sortedSlots[sortedSlots.length - 1]}`);
    endDateTime.setMinutes(endDateTime.getMinutes() + 30);

    if (!selectedPatient) return;
    onSubmit({
        id: initialAppointment?.id,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        status,
        observation
    }, conflictingIds);
    onClose();
  };

  return (
    <>
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialAppointment ? "Edit Appointment" : "New Appointment"}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6 lg:gap-8 p-1">
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-6">
            <section className="space-y-4">
                <h3 className="text-xs font-bold text-surface-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <User size={16} className="text-primary-600 dark:text-primary-400"/>
                    Patient Details
                </h3>

                <div className="bg-surface-50 dark:bg-surface-800/50 p-4 rounded-xl border border-surface-200 dark:border-surface-700 min-h-[110px]">
                    {!selectedPatient ? (
                        <div className="flex gap-2 relative">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 text-surface-900 dark:text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface-900 shadow-sm transition-all"
                                    placeholder="Search name or phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                {searchQuery && (
                                    <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-xl max-h-48 overflow-y-auto">
                                        {filteredPatients.length > 0 ? filteredPatients.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => { setSelectedPatient(p); setSearchQuery(''); setIsDirectoryOpen(false); }}
                                                className="w-full text-left px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700 border-b border-surface-100 dark:border-surface-700 last:border-0 transition-colors"
                                            >
                                                <div className="text-sm font-medium text-surface-900 dark:text-white">{p.name}</div>
                                                <div className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1"><Phone size={12} /> {p.phone}</div>
                                            </button>
                                        )) : (
                                            <div className="px-4 py-3 text-xs text-surface-400 text-center">No patients found.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <Button type="button" variant="secondary" onClick={() => setIsDirectoryOpen(true)}>
                                <BookUser size={20} className="text-surface-600 dark:text-surface-300" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-surface-800 border border-primary-100 dark:border-primary-900/30 rounded-xl shadow-sm animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                                    {selectedPatient.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-surface-900 dark:text-white">{selectedPatient.name}</div>
                                    <div className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-2">
                                        {selectedPatient.phone}
                                        <button
                                            onClick={(e) => openWhatsApp(e, selectedPatient.phone)}
                                            className="text-green-500 hover:text-green-600 transition-colors"
                                            title="Chat on WhatsApp"
                                        >
                                            <MessageCircle size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button type="button" onClick={() => setSelectedPatient(null)} className="p-2 text-surface-400 hover:text-red-500 hover:bg-surface-50 dark:hover:bg-surface-700 rounded-lg transition-colors"><X size={18} /></button>
                        </div>
                    )}
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-xs font-bold text-surface-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity size={16} className={statusTheme[status].icon}/>
                    Status & Notes
                </h3>
                
                {status === 'completed' ? (
                    <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl text-purple-700 dark:text-purple-300">
                        <CheckCircle size={18} />
                        <span className="font-bold text-sm">Appointment Completed</span>
                        <span className="text-xs opacity-70 ml-auto">(Read Only)</span>
                    </div>
                ) : (
                    <div className="flex p-1 bg-surface-100 dark:bg-surface-800 rounded-xl overflow-x-auto">
                        {/* Removed 'completed' from the list so user cannot select it manually */}
                        {(['confirmed', 'pending'] as const).map(s => (
                            <button
                                key={s} type="button" onClick={() => setStatus(s)}
                                className={cn("flex-1 py-2 px-3 text-sm font-medium rounded-lg capitalize transition-all duration-200 whitespace-nowrap", status === s ? statusTheme[s].active : statusTheme[s].inactive)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                <div className="relative">
                    <FileText className={cn("absolute left-3 top-3 transition-colors", statusTheme[status].icon)} size={18} />
                    <textarea
                        className={cn(
                            "w-full pl-10 pr-4 py-3 border rounded-xl outline-none min-h-[120px] text-sm resize-none bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 transition-all",
                            "border-surface-300 dark:border-surface-700",
                            statusTheme[status].focusRing
                        )}
                        value={observation} onChange={e => setObservation(e.target.value)}
                        placeholder="Add clinical notes..."
                        disabled={status === 'completed'} // Optional: lock notes if completed
                    />
                </div>
            </section>
        </div>

        <div className="hidden lg:block w-px bg-surface-200 dark:bg-surface-700" />
        <div className="lg:hidden h-px w-full bg-surface-200 dark:bg-surface-700" />

        {/* Right Column */}
        <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-surface-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon size={16} className="text-primary-600 dark:text-primary-400"/>
                Date & Time
            </h3>

            <div className="relative mb-2">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 dark:text-surface-400 pointer-events-none" size={18} />
                <input 
                    type="date" required
                    className="flex h-12 w-full rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 pl-12 px-4 text-sm font-medium text-surface-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer transition-colors"
                    value={selectedDate} 
                    onChange={e => { setSelectedDate(e.target.value); setSelectedSlots([]); }}
                    disabled={status === 'completed'}
                />
            </div>

            <div className="flex-1 flex flex-col bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden min-h-[350px]">
                <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 flex items-center justify-between text-xs">
                     <span className="font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">Available Slots</span>
                     <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-surface-600 dark:text-surface-400"><Lock size={10} /> Locked</span>
                        <span className="flex items-center gap-1 text-surface-600 dark:text-surface-400"><CheckCircle size={10} /> Done</span>
                     </div>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar relative">
                     {!selectedDate && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-surface-900/60 backdrop-blur-[1px] z-10 text-surface-400">
                            <CalendarIcon size={32} className="mb-2 opacity-50" />
                            <span className="text-sm font-medium">Select a date first</span>
                        </div>
                    )}

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {timeSlots.map((slot) => {
                            const { status: slotStatus } = checkSlotStatus(selectedDate, slot);
                            const isSelected = selectedSlots.includes(slot);
                            const isConfirmed = slotStatus === 'confirmed';
                            const isCompleted = slotStatus === 'completed';
                            const isPending = slotStatus === 'pending' && !isSelected;
                            
                            // Determine style
                            let baseClass = "bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:border-primary-300 hover:text-primary-600 dark:hover:text-primary-400";
                            if (isSelected) baseClass = "bg-primary-600 text-white border-primary-600 shadow-md scale-105 z-10";
                            else if (isConfirmed) baseClass = "bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-600 border-transparent cursor-not-allowed";
                            else if (isCompleted) baseClass = "bg-purple-50 dark:bg-purple-900/20 text-purple-400 dark:text-purple-600 border-purple-100 dark:border-purple-800 cursor-not-allowed";
                            else if (isPending) baseClass = "bg-white dark:bg-surface-900 text-surface-400 border-orange-200 dark:border-orange-900/50 border-dashed cursor-not-allowed";

                            // Disable interaction if status is completed (locked)
                            const isLocked = status === 'completed';

                            return (
                                <button
                                    key={slot} type="button" disabled={isConfirmed || isPending || isCompleted || isLocked} onClick={() => toggleSlot(slot)}
                                    className={cn(
                                        "py-2 px-1 text-xs font-medium rounded-lg border transition-all duration-150 relative flex items-center justify-center",
                                        baseClass
                                    )}
                                >
                                    {isConfirmed && <Lock size={10} className="mr-1 opacity-70" />}
                                    {isCompleted && <CheckCircle size={10} className="mr-1 opacity-70" />}
                                    {slot}
                                    {isPending && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-400 rounded-full" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="p-3 bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
                    <div className="flex items-center gap-2"><Clock size={14} className="text-primary-500"/> <span>{selectedSlots.length > 0 ? `${selectedSlots.length} slots` : 'None'}</span></div>
                    {selectedSlots.length > 0 && <span className="font-semibold text-surface-900 dark:text-white">{selectedSlots.length * 30} mins</span>}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 items-center w-full mt-auto">
                <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
                {initialAppointment && initialAppointment.status !== 'canceled' && status !== 'completed' && (
                    <Button type="button" variant="danger" onClick={(e) => { e.preventDefault(); setShowCancelConfirm(true); }} className="gap-2"><Trash2 size={16} /> Cancel Booking</Button>
                )}
                {status !== 'completed' && (
                    <Button type="submit" className="px-6 shadow-lg shadow-primary-200 dark:shadow-none">Save Appointment</Button>
                )}
            </div>
        </div>
      </form>
    </Modal>
    
    <PatientDirectoryModal isOpen={isDirectoryOpen} onClose={() => setIsDirectoryOpen(false)} onSelect={(p) => { setSelectedPatient(p); setIsDirectoryOpen(false); setSearchQuery(''); }} />

    <Modal isOpen={showCancelConfirm} onClose={() => setShowCancelConfirm(false)} title="Cancel Booking" maxWidth="sm">
        <div className="text-center p-2 dark:text-white">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400"><AlertTriangle size={24} /></div>
            <h3 className="text-lg font-bold mb-2">Are you sure?</h3>
            <p className="text-surface-500 dark:text-surface-400 mb-6">This appointment will be canceled.</p>
            <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setShowCancelConfirm(false)}>Keep it</Button>
                <Button variant="danger" className="flex-1" onClick={() => { onSubmit({ ...initialAppointment, status: 'canceled' }); onClose(); }}>Yes, Cancel</Button>
            </div>
        </div>
    </Modal>

    <Modal isOpen={!!pendingConflictIds} onClose={() => setPendingConflictIds(null)} title="Slot Conflict" maxWidth="sm">
         <div className="text-center p-2 dark:text-white">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600 dark:text-orange-400"><AlertTriangle size={24} /></div>
            <h3 className="text-lg font-bold mb-2">Overwrite Pending Slots?</h3>
            <p className="text-surface-500 dark:text-surface-400 mb-6">Your selection overlaps with existing pending appointments.</p>
            <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setPendingConflictIds(null)}>Cancel</Button>
                <Button className="flex-1" onClick={() => submitFinal(pendingConflictIds || [])}>Overwrite</Button>
            </div>
        </div>
    </Modal>
    </>
  );
};