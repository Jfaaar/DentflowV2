import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Users, Settings, LogOut, Activity, LayoutDashboard, Languages, Check, ChevronUp, Moon, Sun, Receipt } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../features/language/LanguageContext';
import { useTheme } from '../../features/theme/ThemeContext';
import { languages, LanguageCode } from '../../lib/i18n/translations';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
  className?: string;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate, onLogout, className, onMobileClose }) => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'dashboard', label: 'dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'calendar', icon: Calendar },
    { id: 'patients', label: 'patients', icon: Users },
    { id: 'invoices', label: 'invoices', icon: Receipt },
    { id: 'settings', label: 'settings', icon: Settings },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (id: string) => {
    onNavigate(id);
    if (onMobileClose) onMobileClose();
  }

  return (
    <aside className={cn("w-64 bg-white dark:bg-surface-900 border-e border-surface-200 dark:border-surface-800 h-screen flex flex-col transition-all duration-300", className)}>
      <div className="p-6 flex items-center gap-3 border-b border-surface-100 dark:border-surface-800">
        <div className="bg-primary-600 p-2.5 rounded-xl text-white shrink-0 shadow-glow">
          <Activity size={24} />
        </div>
        <div>
          <h1 className="font-bold text-surface-900 dark:text-white text-lg leading-tight">DentFlow</h1>
          <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">{t('clinicManager')}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm" 
                    : "text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-white"
                )}
              >
                <Icon size={20} className={cn("transition-colors", isActive ? "text-primary-600 dark:text-primary-400" : "text-surface-400 dark:text-surface-500 group-hover:text-surface-600 dark:group-hover:text-surface-300")} />
                {/* @ts-ignore */}
                {t(item.label)}
              </button>
            );
        })}
      </nav>

      <div className="p-4 border-t border-surface-100 dark:border-surface-800 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
        </button>

        {/* Language Selector */}
        <div className="relative" ref={langMenuRef}>
          <button 
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors border border-transparent hover:border-surface-200 dark:hover:border-surface-700"
          >
            <div className="flex items-center gap-3">
              <Languages size={20} className="text-surface-400" />
              <span>{languages.find(l => l.code === language)?.name}</span>
            </div>
            <ChevronUp size={16} className={cn("transition-transform", isLangMenuOpen ? "rotate-180" : "")} />
          </button>

          {isLangMenuOpen && (
            <div className="absolute bottom-full start-0 w-full mb-2 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-xl overflow-hidden animate-slide-up z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as LanguageCode);
                    setIsLangMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-start hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                >
                  <span className={cn("font-medium", language === lang.code ? "text-primary-600 dark:text-primary-400" : "text-surface-700 dark:text-surface-300")}>
                    {lang.name}
                  </span>
                  {language === lang.code && <Check size={16} className="text-primary-600 dark:text-primary-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
            <LogOut size={20} />
            {t('signOut')}
        </button>
      </div>
    </aside>
  );
};