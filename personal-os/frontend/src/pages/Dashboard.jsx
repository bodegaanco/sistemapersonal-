import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare, ListTodo, Flame, Dumbbell, Trophy,
  Wallet, Target, CalendarDays, Clock3,
} from 'lucide-react';
import api from '../api/client';
import Card from '../components/Card';
import ProgressRing from '../components/ProgressRing';
import { fechaLarga, horaActual, saludo } from '../utils/dates';

const MODULOS = [
  { to: '/checklist', label: 'Tareas pendientes', icon: CheckSquare, key: 'checklist' },
  { to: '/habitos', label: 'Hábitos', icon: Flame, key: 'habits' },
  { to: '/gym', label: 'Gym', icon: Dumbbell },
  { to: '/futbol', label: 'Fútbol', icon: Trophy },
  { to: '/finanzas', label: 'Finanzas', icon: Wallet },
  { to: '/objetivos', label: 'Objetivos', icon: Target },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/horario', label: 'Horario semanal', icon: Clock3 },
  { to: '/tareas', label: 'Tareas del día', icon: ListTodo, key: 'tasks' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api.get('/dashboard').then(setData).catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 animate-enter">
      <Card className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-sm text-[var(--color-text-muted)] mb-1">{fechaLarga(now)} · {horaActual(now)}</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">
            {saludo(now)}, {data?.userName || '...'}.
          </h1>
          <p className="text-[var(--color-text-muted)] max-w-md italic">
            “{data?.phrase || 'Cargando tu resumen del día...'}”
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 shrink-0">
          <ProgressRing percentage={data?.progress ?? 0} />
          <span className="text-xs text-[var(--color-text-muted)]">Progreso de hoy</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ResumenMini label="Checklist" done={data?.checklist?.done} total={data?.checklist?.total} />
        <ResumenMini label="Tareas" done={data?.tasks?.done} total={data?.tasks?.total} />
        <ResumenMini label="Hábitos" done={data?.habits?.done} total={data?.habits?.total} />
      </div>

      <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
        Tu centro de organización
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MODULOS.map(({ to, label, icon: Icon, soon }) => (
          <Link
            key={to}
            to={soon ? '#' : to}
            className={`group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-3 transition-all duration-150 ${
              soon ? 'opacity-50 cursor-default' : 'hover:bg-[var(--color-surface-hover)] hover:-translate-y-0.5'
            }`}
          >
            <Icon size={20} strokeWidth={1.8} className="text-[var(--color-accent-strong)]" />
            <span className="text-sm font-medium">{label}</span>
            {soon && <span className="text-[10px] text-[var(--color-text-dim)] uppercase">Próxima etapa</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

function ResumenMini({ label, done = 0, total = 0 }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
        <p className="font-mono text-xl">
          {done ?? 0}<span className="text-[var(--color-text-dim)]">/{total ?? 0}</span>
        </p>
      </div>
      <span className="font-mono text-sm text-[var(--color-accent-strong)]">{pct}%</span>
    </Card>
  );
}
