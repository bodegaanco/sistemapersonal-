import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Checklist from './pages/Checklist';
import Tasks from './pages/Tasks';
import Habits from './pages/Habits';
import Settings from './pages/Settings';
import ComingSoon from './pages/ComingSoon';
import Login from './pages/Login';
import api from './api/client';

export default function App() {
  const [authState, setAuthState] = useState('checking'); // checking | in | out

  useEffect(() => {
    api
      .get('/auth/me')
      .then((d) => setAuthState(d.authenticated ? 'in' : 'out'))
      .catch(() => setAuthState('out'));
  }, []);

  if (authState === 'checking') {
    return <div className="h-screen w-screen bg-[var(--color-bg)]" />;
  }

  if (authState === 'out') {
    return <Login onSuccess={() => setAuthState('in')} />;
  }

  return (
    <HashRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg)]">
        <Sidebar onLogout={() => setAuthState('out')} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/tareas" element={<Tasks />} />
            <Route path="/habitos" element={<Habits />} />
            <Route path="/gym" element={<ComingSoon title="Gym" />} />
            <Route path="/futbol" element={<ComingSoon title="Fútbol" />} />
            <Route path="/calendario" element={<ComingSoon title="Calendario" />} />
            <Route path="/finanzas" element={<ComingSoon title="Finanzas" />} />
            <Route path="/objetivos" element={<ComingSoon title="Objetivos" />} />
            <Route path="/diario" element={<ComingSoon title="Diario" />} />
            <Route path="/ajustes" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
