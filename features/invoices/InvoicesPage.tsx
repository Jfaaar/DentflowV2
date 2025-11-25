import React, { useState, useEffect, useMemo } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { Appointment, Invoice } from '../../types';
import { formatDate, formatTime } from '../../lib/utils';
import { Receipt, Check, Loader2, DollarSign, Clock, Coins, Search, Filter, X, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '../../features/language/LanguageContext';

export const InvoicesPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Creation State
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [amount, setAmount] = useState('0');
  const [status, setStatus] = useState<'paid' | 'unpaid'>('unpaid');
  const [isCreating, setIsCreating] = useState(false);

  // Filter State
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  
  const [filterStart, setFilterStart] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, '0');
    const d = String(start.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [filterEnd, setFilterEnd] = useState(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); 
    const y = end.getFullYear();
    const m = String(end.getMonth() + 1).padStart(2, '0');
    const d = String(end.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const refreshData = async () => {
    setIsLoading(true);
    try {
        const [allAppts, allInvoices] = await Promise.all([
            api.appointments.list(),
            api.invoices.list()
        ]);
        
        setInvoices(allInvoices);

        const invoicedApptIds = new Set(allInvoices.map(inv => inv.appointmentId));
        const readyForInvoice = allAppts
            .filter(a => a.status === 'completed' && !invoicedApptIds.has(a.id))
            .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
        
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

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
        const matchName = filterName === '' || inv.patientName.toLowerCase().includes(filterName.toLowerCase());
        const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
        let matchDate = true;
        const invDate = new Date(inv.date).toISOString().split('T')[0];
        if (filterStart) matchDate = matchDate && invDate >= filterStart;
        if (filterEnd) matchDate = matchDate && invDate <= filterEnd;

        return matchName && matchStatus && matchDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, filterName, filterStatus, filterStart, filterEnd]);

  const handleOpenCreate = (apt: Appointment) => {
    setSelectedAppt(apt);
    setAmount('');
    setStatus('unpaid');
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
        
        <section>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="text-primary-600" />
                {t('pendingInvoicing')}
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{completedAppointments.length}</span>
            </h3>
            
            {completedAppointments.length === 0 ? (
                <div className="p-6 bg-surface-50 dark:bg-surface-800 rounded-xl border border-dashed border-surface-200 dark:border-surface-700 text-center text-surface-500 text-sm">
                    {t('allInvoiced')}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedAppointments.map(apt => (
                        <Card key={apt.id} className="p-4 flex flex-col gap-3 hover:border-primary-300 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-surface-900 dark:text-white">{apt.patientName}</h4>
                                    <p className="text-xs text-surface-500">{formatDate(new Date(apt.start), language)}</p>
                                </div>
                                <div className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                    {t('completed')}
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

        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                    <Receipt className="text-surface-500" />
                    {t('invoiceHistory')}
                </h3>
            </div>

            <div className="p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/3">
                    <label className="text-xs font-semibold text-surface-500 uppercase mb-1 block">{t('searchPatient')}</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
                        <input 
                            type="text" 
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Name..."
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-full md:w-auto">
                    <label className="text-xs font-semibold text-surface-500 uppercase mb-1 block">{t('filterStatus')}</label>
                    <select 
                        className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                    >
                        <option value="all">{t('allStatus')}</option>
                        <option value="paid">{t('paidOnly')}</option>
                        <option value="unpaid">{t('unpaidOnly')}</option>
                    </select>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div>
                        <label className="text-xs font-semibold text-surface-500 uppercase mb-1 block">{t('filterFrom')}</label>
                        <input 
                            type="date"
                            className="px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={filterStart}
                            onChange={(e) => setFilterStart(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-surface-500 uppercase mb-1 block">{t('filterTo')}</label>
                        <input 
                            type="date"
                            className="px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={filterEnd}
                            onChange={(e) => setFilterEnd(e.target.value)}
                        />
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => { setFilterName(''); setFilterStatus('all'); setFilterStart(''); setFilterEnd(''); }}
                    className="mb-0.5 text-surface-400 hover:text-red-500"
                    title={t('clearFilters')}
                >
                    <X size={20} />
                </Button>
            </div>
            
            <Card className="overflow-hidden" noPadding>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                            <tr>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase">{t('tableDate')}</th>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase">{t('tableName')}</th>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase">{t('tableAmount')}</th>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase">{t('tableStatus')}</th>
                                <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase text-right">{t('tableAction')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                            {filteredInvoices.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-surface-400">{t('noInvoicesMatch')}</td></tr>
                            ) : filteredInvoices.map(inv => (
                                <tr key={inv.id} className="group hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                                    <td className="py-3 px-4 text-sm text-surface-600 dark:text-surface-300">{formatDate(new Date(inv.date), language)}</td>
                                    <td className="py-3 px-4 font-medium text-surface-900 dark:text-white">{inv.patientName}</td>
                                    <td className="py-3 px-4 font-bold text-surface-900 dark:text-white">{inv.amount.toFixed(2)} DH</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                            inv.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {/* @ts-ignore */}
                                            {t(inv.status)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end">
                                            {inv.status === 'unpaid' ? (
                                                <button 
                                                    onClick={() => handleToggleStatus(inv)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 rounded-md text-xs font-semibold transition-colors border border-green-200 dark:border-green-800"
                                                >
                                                    <CheckCircle size={14} />
                                                    {t('markPaid')}
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleToggleStatus(inv)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-md text-xs font-semibold transition-colors border border-red-200 dark:border-red-800"
                                                >
                                                    <XCircle size={14} />
                                                    {t('markUnpaid')}
                                                </button>
                                            )}
                                        </div>
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
                    <p className="text-xs text-surface-500">{formatDate(new Date(selectedAppt.start), language)}</p>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-surface-500 uppercase">{t('amount')} (DH)</label>
                    <div className="relative">
                        <Coins size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
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
                    <Button type="button" variant="ghost" onClick={() => setSelectedAppt(null)}>{t('cancel')}</Button>
                    <Button type="submit" disabled={!amount || isCreating}>
                        {isCreating && <Loader2 className="animate-spin mr-2" size={16}/>}
                        {t('confirm')}
                    </Button>
                </div>
            </form>
        )}
      </Modal>
    </div>
  );
};