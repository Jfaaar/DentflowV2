import React from 'react';
import { Appointment } from '../../../types';
import { cn } from '../../../lib/utils';
import { isToday } from '../utils/dateUtils';
import { useLanguage } from '../../language/LanguageContext';

interface DayViewProps {
  date: Date;
  appointments: Appointment[];
  onEditAppointment: (apt: Appointment) => void;
  onSlotClick: (time: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({ date, appointments, onEditAppointment, onSlotClick }) => {
  const { t, language } = useLanguage();
  const startHour = 8;
  const endHour = 18;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);
  const isCurrentDay = isToday(date);

  const getPosition = (timeStr: string) => {
    const d = new Date(timeStr);
    const h = d.getHours();
    const m = d.getMinutes();
    if (h < startHour || h > endHour) return null;
    
    // Calculate percentage from top
    const totalMinutes = (endHour - startHour + 1) * 60;
    const minutesFromStart = (h - startHour) * 60 + m;
    return (minutesFromStart / totalMinutes) * 100;
  };

  const getDurationHeight = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffMins = (e.getTime() - s.getTime()) / 60000;
    const totalMinutes = (endHour - startHour + 1) * 60;
    return (diffMins / totalMinutes) * 100;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
        {/* Header */}
        <div className="py-4 px-6 border-b border-surface-200 bg-surface-50 flex items-center gap-3">
            <div className={cn(
                "text-2xl font-bold",
                isCurrentDay ? "text-primary-600" : "text-surface-900"
            )}>
                {date.getDate()}
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide">
                    {date.toLocaleDateString(language, { weekday: 'long' })}
                </span>
                <span className="text-xs text-surface-400">{t('dailyTimeline')}</span>
            </div>
        </div>

      <div className="flex-1 relative overflow-y-auto custom-scrollbar">
        <div className="absolute inset-0 flex flex-col min-h-[800px]">
          {hours.map(hour => (
            <div key={hour} className="flex-1 border-b border-surface-300 flex min-h-[60px] group relative">
              {/* Hour Label */}
              <div className="w-20 flex-shrink-0 border-r border-surface-200 text-xs font-bold text-surface-600 p-3 text-right bg-surface-50/50">
                {hour}:00
              </div>
              
              <div className="flex-1 relative">
                <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-surface-200 pointer-events-none" />

                <div 
                    className="absolute top-0 left-0 right-0 h-1/2 cursor-pointer hover:bg-primary-50/30 dark:hover:bg-primary-900/20 transition-colors z-10"
                    onClick={() => {
                        const d = new Date(date);
                        d.setHours(hour, 0, 0, 0);
                        onSlotClick(d.toISOString());
                    }}
                />

                <div 
                    className="absolute bottom-0 left-0 right-0 h-1/2 cursor-pointer hover:bg-primary-50/30 dark:hover:bg-primary-900/20 transition-colors z-10"
                    onClick={() => {
                        const d = new Date(date);
                        d.setHours(hour, 30, 0, 0);
                        onSlotClick(d.toISOString());
                    }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="absolute inset-0 ml-20 pointer-events-none min-h-[800px]">
            {appointments.map(apt => {
                const top = getPosition(apt.start);
                const height = getDurationHeight(apt.start, apt.end);
                if (top === null) return null;

                const statusStyles = {
                    confirmed: 'bg-white border-l-4 border-green-500 shadow-sm',
                    pending: 'bg-white border-l-4 border-orange-500 shadow-sm',
                    completed: 'bg-white border-l-4 border-purple-500 shadow-sm opacity-80',
                    canceled: 'bg-surface-50 border-l-4 border-surface-300 opacity-60'
                };

                return (
                    <div
                        key={apt.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditAppointment(apt);
                        }}
                        style={{ top: `${top}%`, height: `${height}%` }}
                        className={cn(
                            "absolute inset-x-4 my-0.5 rounded-r-lg border border-surface-200 p-3 cursor-pointer pointer-events-auto transition-all hover:shadow-md z-20 hover:z-30 flex flex-col justify-center",
                            statusStyles[apt.status]
                        )}
                    >
                        <div className="flex justify-between items-center">
                             <span className="font-bold text-surface-900 text-sm">{apt.patientName}</span>
                             <div className={cn(
                                "w-2 h-2 rounded-full",
                                apt.status === 'confirmed' ? 'bg-green-500' : 
                                apt.status === 'pending' ? 'bg-orange-500' : 
                                apt.status === 'completed' ? 'bg-purple-500' : 'bg-surface-400'
                             )} />
                        </div>
                        <div className="text-xs text-surface-500 flex items-center gap-2 mt-0.5">
                             <span>
                                {new Date(apt.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})} - 
                                {new Date(apt.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                             </span>
                             {apt.observation && <span className="truncate max-w-[150px] italic opacity-75">- {apt.observation}</span>}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};