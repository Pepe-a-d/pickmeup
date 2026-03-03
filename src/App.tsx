import { AppProvider, useApp } from './hooks/useApp';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { PassengerView } from './pages/PassengerView';
import { InstallGate, useIsStandalone } from './pages/InstallGate';

function AppRoutes() {
  const { auth } = useApp();
  if (!auth) return <LoginPage />;
  if (auth.role === 'admin') return <AdminDashboard />;
  return <PassengerView />;
}

function AppShell() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

export default function App() {
  const isStandalone = useIsStandalone();
  if (!isStandalone) return <InstallGate />;
  return <AppShell />;
}
