import { useEffect, useState } from 'react';
import { Trophy, Trash2, Target, Footprints, Clock } from 'lucide-react';
import api from '../api/client';
import Card from '../components/Card';
import { todayISO } from '../utils/dates';

const ESTADOS_FISICOS = ['Excelente', 'Bien', 'Cansado', 'Con molestias', 'Lesionado'];

export default function Futbol() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const [form, setForm] = useState({
    date: todayISO(),
    type: 'partido',
    position: '',
    minutes: '',
    goals: 0,
    assists: 0,
    physical_state: '',
    feeling: '',
    notes: '',
  });

  function load() {
    api.get('/futbol').then(setLogs);
    api.get('/futbol/stats/summary').then(setStats);
  }

  useEffect(() => {
    load();
  }, []);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    await api.post('/futbol', {
      ...form,
      minutes: form.minutes ? Number(form.minutes) : null,
      goals: Number(form.goals) || 0,
      assists: Number(form.assists) || 0,
    });
    setForm({
      date: todayISO(), type: 'partido', position: '', minutes: '',
      goals: 0, assists: 0, physical_state: '', feeling: '', notes: '',
    });
    load();
  }

  async function removeLog(id) {
    if (!confirm('¿Eliminar este registro?')) return;
    await api.delete(`/futbol/${id}`);
    load();
  }

  const filtered = logs.filter((l) => filterType === 'all' || l.type === filterType);

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-10 animate-enter">
      <div className="mb-6 flex items-center gap-2">
        <Trophy size={22} className="text-[var(--color-accent-strong)]" />
        <h1 className="text-2xl font-semibold tracking-tight">Fútbol</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatMini icon={Trophy} label="Partidos" value={stats.partidos} />
          <StatMini icon={Target} label="Goles" value={stats.goles} />
          <StatMini icon={Footprints} label="Asistencias" value={stats.asistencias} />
          <StatMini icon={Clock} label="Minutos" value={stats.minutos} />
        </div>
      )}

      <Card className="mb-6">
        <h2 className="text-sm font-medium mb-4">Nuevo registro</h2>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none"
            />
            <select
              value={form.type}
              onChange={(e) => updateField('type', e.target.value)}
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none"
            >
              <option value="partido">Partido</option>
              <option value="entrenamiento">Entrenamiento</option>
            </select>
            <input
              value={form.position}
              onChange={(e) => updateField('position', e.target.value)}
              placeholder="Posición"
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none w-32"
            />
            <input
              type="number"
              value={form.minutes}
              onChange={(e) => updateField('minutes', e.target.value)}
              placeholder="Minutos"
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none w-24"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              Goles
              <input
                type="number"
                min="0"
                value={form.goals}
                onChange={(e) => updateField('goals', e.target.value)}
                className="w-16 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              Asistencias
              <input
                type="number"
                min="0"
                value={form.assists}
                onChange={(e) => updateField('assists', e.target.value)}
                className="w-16 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm outline-none"
              />
            </label>
            <select
              value={form.physical_state}
              onChange={(e) => updateField('physical_state', e.target.value)}
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none"
            >
              <option value="">Estado físico</option>
              {ESTADOS_FISICOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <input
            value={form.feeling}
            onChange={(e) => updateField('feeling', e.target.value)}
            placeholder="¿Cómo me sentí?"
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Observaciones"
            rows={2}
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] resize-none"
          />

          <button
            type="submit"
            className="self-start bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] transition-colors px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            Guardar
          </button>
        </form>
      </Card>

      <div className="mb-3 flex gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1 w-fit">
        {[['all', 'Todos'], ['partido', 'Partidos'], ['entrenamiento', 'Entrenamientos']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              filterType === key ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((log) => (
          <Card key={log.id} className="!p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">
                {log.date} · {log.type === 'partido' ? 'Partido' : 'Entrenamiento'}
                {log.position && ` · ${log.position}`}
              </span>
              <button onClick={() => removeLog(log.id)} className="text-[var(--color-text-dim)] hover:text-[var(--color-danger)]">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex gap-4 text-xs text-[var(--color-text-muted)] font-mono">
              {log.minutes != null && <span>{log.minutes}′</span>}
              <span>⚽ {log.goals}</span>
              <span>🅰️ {log.assists}</span>
              {log.physical_state && <span>{log.physical_state}</span>}
            </div>
            {log.feeling && <p className="text-xs text-[var(--color-text-muted)] mt-1">"{log.feeling}"</p>}
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-10">
            No hay registros todavía.
          </p>
        )}
      </div>
    </div>
  );
}

function StatMini({ icon: Icon, label, value }) {
  return (
    <Card className="!p-3.5 flex flex-col gap-1">
      <Icon size={14} className="text-[var(--color-accent-strong)]" />
      <span className="font-mono text-lg">{value ?? 0}</span>
      <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">{label}</span>
    </Card>
  );
}
