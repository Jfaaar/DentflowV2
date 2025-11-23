import React, { useState, useEffect } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { Appointment, Invoice } from '../../types';
import { formatDate, formatTime } from '../../lib/utils';
import { Receipt, Check, Loader2, DollarSign, Clock } from 'lucide-react';
import { useLanguage } from '../../features/language/LanguageContext';

export const InvoicesPage: React.FC = () => {
  const { t } = useLanguage();
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Creation State
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [amount, setAmount] = useState('0');
  const [status, setStatus] = useState<'paid' | 'unpaid'>('paid');
  const [isCreating, setIsCreating] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
        const [allAppts, allInvoices] = await Promise.all([
            api.appointments.list(),
            api.invoices.list()
        ]);
        
        setInvoices(allInvoices);

        // Filter appointments that are completed BUT NOT yet invoiced
        const invoicedApptIds = new Set(allInvoices.map(inv => inv.appointmentId));
        const readyForInvoice = allAppts
            .filter(a => a.status === 'completed' && !invoicedApptIds.has(a.id))
            .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()); // Newest first
        
        setCompletedAppointments(readyForInvoice);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleOpenCreate = (apt: Appointment) => {
    setSelectedAppt(apt);
    setAmount('');
    setStatus('paid');
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setIsCreating(true);
    try {
        await api.invoices.create({
            appointmentId: selectedAppt.id,
            patientId: selectedAppt.patientId,
            patientName: selectedAppt.patientName,
            amount: parseFloat(amount),
            status: status,
            date: new Date().toISOString()
        });
        setSelectedAppt(null);
        refreshData();
    } catch(e) {
        alert("Failed to create invoice");
    } finally {
        setIsCreating(false);
    }
  };

  const handleToggleStatus = async (inv: Invoice) => {
      const newStatus = inv.status === 'paid' ? 'unpaid' : 'paid';
      await api.invoices.update({ ...inv, status: newStatus });
      refreshData();
  };

  return (
    <div className="flex flex-col h-full">
      <Topbar title={t('invoices')} />
      
      <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 md:gap-8">
        
        {/* Section 1: Ready to Invoice */}
        <section>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="text-primary-600" />
                Pending Invoicing
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{completedAppointments.length}</span>
            </h3>
            
            {completedAppointments.length === 0 ? (
                <div className="p-8 bg-surface-50 dark:bg-surface-800 rounded-xl border border-dashed border-surface-200 dark:border-surface-700 text-center text-surface-500">
                    All completed consultations have been invoiced.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedAppointments.map(apt => (
                        <Card key={apt.id} className="p-4 flex flex-col gap-3 hover:border-primary-300 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-surface-900 dark:text-white">{apt.patientName}</h4>
                                    <p className="text-xs text-surface-500">{formatDate(new Date(apt.start))}</p>
                                </div>
                                <div className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                    Completed
                                </div>
                            </div>
                            <Button size="sm" onClick={() => handleOpenCreate(apt)} className="w-full mt-auto">
                                {t('createInvoice')}
                            </Button>
                        </Card>
                    ))}
                </div>
            )}
        </section>

        {/* Section 2: Invoice History */}
        <section>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <Receipt className="text-surface-500" />
                Invoice History
            </h3>
            
            <Card className="overflow-hidden" noPadding>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                            <tr>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase">Date</th>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase">Patient</th>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase">Amount</th>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase">Status</th>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                            {invoices.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-surface-400">No invoices generated yet.</td></tr>
                            ) : invoices.map(inv => (
                                <tr key={inv.id} className="group hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                                    <td className="py-3 px-4 text-sm text-surface-600 dark:text-surface-300">{formatDate(new Date(inv.date))}</td>
                                    <td className="py-3 px-4 font-medium text-surface-900 dark:text-white">{inv.patientName}</td>
                                    <td className="py-3 px-4 font-bold text-surface-900 dark:text-white">${inv.amount.toFixed(2)}</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                            inv.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {inv.status === 'paid' ? t('paid') : t('unpaid')}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button 
                                            onClick={() => handleToggleStatus(inv)}
                                            className="text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 underline"
                                        >
                                            Mark as {inv.status === 'paid' ? 'Unpaid' : 'Paid'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </section>

      </div>

      <Modal 
        isOpen={!!selectedAppt} 
        onClose={() => setSelectedAppt(null)} 
        title={t('generateInvoice')}
        maxWidth="sm"
      >
        {selectedAppt && (
            <form onSubmit={handleCreateInvoice} className="space-y-4 p-1">
                <div className="bg-surface-50 dark:bg-surface-800 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                    <p className="text-sm font-bold text-surface-900 dark:text-white">{selectedAppt.patientName}</p>
                    <p className="text-xs text-surface-500">{formatDate(new Date(selectedAppt.start))}</p>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-surface-500 uppercase">{t('amount')}</label>
                    <div className="relative">
                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                        <Input 
                            type="number" 
                            step="0.01" 
                            className="pl-10" 
                            placeholder="0.00" 
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-surface-500 uppercase">{t('status')}</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setStatus('paid')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                                status === 'paid' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-surface-200 text-surface-500 hover:bg-surface-50'
                            }`}
                        >
                            {t('paid')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatus('unpaid')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                                status === 'unpaid' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-surface-200 text-surface-500 hover:bg-surface-50'
                            }`}
                        >
                            {t('unpaid')}
                        </button>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setSelectedAppt(null)}>Cancel</Button>
                    <Button type="submit" disabled={!amount || isCreating}>
                        {isCreating && <Loader2 className="animate-spin mr-2" size={16}/>}
                        Confirm
                    </Button>
                </div>
            </form>
        )}
      </Modal>
    </div>
  );
};