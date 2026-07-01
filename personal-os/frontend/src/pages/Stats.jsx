import { useEffect, useState } from 'react';
import { BarChart3, Flame, Dumbbell, Trophy, Wallet, Target, CheckSquare } from 'lucide-react';
import api from '../api/client';
import Card from '../components/Card';
import MiniLineChart from '../components/MiniLineChart';

function formatCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);
}

export default function Stats() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/stats/overview').then(setData);
  }, []);

  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-10 animate-enter">
      <div className="mb-6 flex items-center gap-2">
        <BarChart3 size={22} className="text-[var(--color-accent-strong)]" />
        <h1 className="text-2xl font-semibold tracking-tight">Estadísticas</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard icon={Flame} label="Mejor racha activa" value={data.bestCurrentStreak} suffix=" días" />
        <StatCard icon={CheckSquare} label="Tareas (30d)" value={`${data.tasks.done}/${data.tasks.total}`} />
        <StatCard icon={Dumbbell} label="Entrenamientos (30d)" value={data.gymSessionsLast30} />
        <StatCard icon={Trophy} label="Goles (30d)" value={data.futbolLast30.goles} />
        <StatCard icon={Target} label="Objetivos cumplidos" value={`${data.goals.completadas}/${data.goals.total}`} />
        <StatCard icon={Wallet} label="Saldo del mes" value={formatCLP(data.financeMonth.saldo)} small />
      </div>

      <Card className="mb-6">
        <h2 className="text-sm font-medium mb-1">Cumplimiento diario (últimos 14 días)</h2>
        <div className="flex gap-4 mb-3 text-xs">
          <span className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: 'var(--color-accent)' }} /> Checklist
          </span>
          <span className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: 'var(--color-success)' }} /> Hábitos
          </span>
        </div>
        <MiniLineChart
          series={[
            { data: data.series, color: 'var(--color-accent)', valueKey: 'checklistPct' },
            { data: data.series, color: 'var(--color-success)', valueKey: 'habitsPct' },
          ]}
          labelKey="date"
        />
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-sm font-medium mb-3">Finanzas del mes</h2>
          <Row label="Ingresos" value={formatCLP(data.financeMonth.ingresos)} color="var(--color-success)" />
          <Row label="Gastos" value={formatCLP(data.financeMonth.gastos)} color="var(--color-danger)" />
          <Row label="Saldo" value={formatCLP(data.financeMonth.saldo)} bold />
        </Card>
        <Card>
          <h2 className="text-sm font-medium mb-3">Fútbol (últimos 30 días)</h2>
          <Row label="Sesiones" value={data.futbolLast30.sesiones} />
          <Row label="Goles" value={data.futbolLast30.goles} />
          <Row label="Asistencias" value={data.futbolLast30.asistencias} />
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, suffix = '', small }) {
  return (
    <Card className="!p-3.5 flex flex-col gap-1">
      <Icon size={14} className="text-[var(--color-accent-strong)]" />
      <span className={`font-mono ${small ? 'text-sm' : 'text-lg'}`}>{value}{suffix}</span>
      <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide leading-tight">{label}</span>
    </Card>
  );
}

function Row({ label, value, color, bold }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--color-border-soft)] last:border-0">
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      <span className={`font-mono text-sm ${bold ? 'font-semibold' : ''}`} style={color ? { color } : {}}>{value}</span>
    </div>
  );
}
