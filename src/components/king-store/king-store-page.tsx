"use client";

import { AppProvider, useAppContext } from '@/context/app-context';
import { LoginForm } from './login-form';
import { UserDashboard } from './user-dashboard';
import { AdminDashboard } from './admin-dashboard';
import { SettingsPage } from './settings-page';
import { RegisterForm } from './register-form';

function KingStoreAppContent() {
  const { view } = useAppContext();

  const renderView = () => {
    switch (view) {
      case 'user_dashboard':
        return <UserDashboard />;
      case 'admin_dashboard':
        return <AdminDashboard />;
      case 'settings':
        return <SettingsPage />;
      case 'register':
        return <RegisterForm />;
      case 'login':
      default:
        return <LoginForm />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="w-full py-6 bg-gradient-to-l from-[#00c3ff] to-[#007bff] shadow-md">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-white font-headline tracking-wider">
          KING STORE
        </h1>
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        {renderView()}
      </main>
    </div>
  );
}

export default function KingStorePage() {
  return (
    <AppProvider>
      <KingStoreAppContent />
    </AppProvider>
  );
}
