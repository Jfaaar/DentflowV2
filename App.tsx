import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './features/auth/LoginPage';
import { AuthProvider, useAuth } from './features/auth/useAuth';
import { LanguageProvider } from './features/language/LanguageContext';
import { ThemeProvider } from './features/theme/ThemeContext';
import { CalendarPage } from './features/calendar/CalendarPage';
import { PatientsPage } from './features/patients/PatientsPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { InvoicesPage } from './features/invoices/InvoicesPage';
import { Topbar } from './components/layout/Topbar';

// Main Application Content (Protected)
const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');

  const renderContent = () => {
    switch (activeTab) {
        case 'dashboard':
            return <DashboardPage />;
        case 'calendar':
            return <CalendarPage />;
        case 'patients':
            return <PatientsPage />;
        case 'invoices':
            return <InvoicesPage />;
        case 'settings':
            return (
                <>
                    <Topbar title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
                    <div className="flex flex-col items-center justify-center h-full text-surface-400 dark:text-surface-500">
                        <div className="bg-surface-100 dark:bg-surface-800 p-6 rounded-full mb-4">
                            <span className="text-4xl grayscale opacity-50">🚧</span>
                        </div>
                        <h3 className="text-xl font-medium text-surface-900 dark:text-white">Feature Under Construction</h3>
                        <p className="max-w-xs text-center mt-2 text-surface-500 dark:text-surface-400">
                            The {activeTab} module is currently being developed.
                        </p>
                    </div>
                </>
            );
        default:
            return null;
    }
  };

  return (
    <Layout
        sidebar={<Sidebar activeTab={activeTab} onNavigate={setActiveTab} onLogout={logout} />}
    >
        {renderContent()}
    </Layout>
  );
};

// Root App Component with Providers
function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

// Separated to use hook context
const AuthConsumer = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <LoginPage />;
}

export default App;