import { NavLink } from 'react-router-dom';
import {
  LayoutGrid, CheckSquare, ListTodo, Flame, Dumbbell,
  Trophy, CalendarDays, Clock3, Wallet, Target, BookOpen, Settings, LogOut,
} from 'lucide-react';
import api from '../api/client';

const NAV_ITEMS = [
  { to: '/', label: 'Hoy', icon: LayoutGrid, end: true },
  { to: '/checklist', label: 'Checklist diario', icon: CheckSquare },
  { to: '/tareas', label: 'Tareas', icon: ListTodo },
  { to: '/habitos', label: 'Hábitos', icon: Flame },
  { to: '/gym', label: 'Gym', icon: Dumbbell },
  { to: '/futbol', label: 'Fútbol', icon: Trophy },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/horario', label: 'Horario semanal', icon: Clock3 },
  { to: '/finanzas', label: 'Finanzas', icon: Wallet },
  { to: '/objetivos', label: 'Objetivos', icon: Target },
  { to: '/diario', label: 'Diario', icon: BookOpen, soon: true },
];

export default function Sidebar({ onLogout }) {
  async function handleLogout() {
    await api.post('/auth/logout');
    onLogout?.();
  }

  return (
    <aside className="flex w-[68px] md:w-[248px] shrink-0 flex-col border-r border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] px-2 md:px-3 py-5 transition-all">
      <div className="px-1 md:px-3 mb-8 flex items-center justify-center md:justify-start gap-2">
        <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-sm font-semibold shrink-0">
          P
        </div>
        <span className="hidden md:inline font-semibold tracking-tight text-[15px]">Personal OS</span>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, soon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            className={({ isActive }) =>
              `group flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                isActive
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
              }`
            }
          >
            <Icon size={17} strokeWidth={1.8} className="shrink-0" />
            <span className="hidden md:flex flex-1">{label}</span>
            {soon && (
              <span className="hidden md:inline text-[10px] uppercase tracking-wide text-[var(--color-text-dim)]">
                pronto
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/ajustes"
        title="Ajustes"
        className={({ isActive }) =>
          `flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
            isActive
              ? 'bg-[var(--color-surface)] text-[var(--color-text)]'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
          }`
        }
      >
        <Settings size={17} strokeWidth={1.8} className="shrink-0" />
        <span className="hidden md:inline">Ajustes</span>
      </NavLink>

      <button
        onClick={handleLogout}
        title="Cerrar sesión"
        className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2 mt-1 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-danger)] transition-colors"
      >
        <LogOut size={17} strokeWidth={1.8} className="shrink-0" />
        <span className="hidden md:inline">Cerrar sesión</span>
      </button>
    </aside>
  );
}
