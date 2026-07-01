import { useEffect, useState } from 'react';
import { Plus, Trash2, Clock3 } from 'lucide-react';
import api from '../api/client';
import Card from '../components/Card';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const COLORES = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899'];

export default function Schedule() {
  const [blocks, setBlocks] = useState([]);
  const [formDay, setFormDay] = useState(null);
  const [form, setForm] = useState({ start_time: '08:00', end_time: '', title: '', color: COLORES[0] });

  function load() {
    api.get('/schedule').then(setBlocks);
  }

  useEffect(() => {
    load();
  }, []);

  function blocksForDay(weekday) {
    return blocks.filter((b) => b.weekday === weekday);
  }

  function openForm(weekday) {
    setFormDay(weekday);
    setForm({ start_time: '08:00', end_time: '', title: '', color: COLORES[0] });
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    await api.post('/schedule', { weekday: formDay, ...form, end_time: form.end_time || null });
    setFormDay(null);
    load();
  }

  async function removeBlock(id) {
    await api.delete(`/schedule/${id}`);
    load();
  }

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 animate-enter">
      <div className="mb-6 flex items-center gap-2">
        <Clock3 size={22} className="text-[var(--color-accent-strong)]" />
        <h1 className="text-2xl font-semibold tracking-tight">Horario semanal</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DIAS.map((dia, weekday) => (
          <Card key={dia} className="!p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{dia}</span>
              <button onClick={() => openForm(weekday)} className="text-[var(--color-text-dim)] hover:text-[var(--color-accent-strong)]">
                <Plus size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {blocksForDay(weekday)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5"
                    style={{ backgroundColor: `${b.color}1f` }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: b.color }}>{b.title}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-mono">
                        {b.start_time}{b.end_time ? ` – ${b.end_time}` : ''}
                      </p>
                    </div>
                    <button onClick={() => removeBlock(b.id)} className="text-[var(--color-text-dim)] hover:text-[var(--color-danger)] shrink-0">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              {blocksForDay(weekday).length === 0 && (
                <p className="text-[11px] text-[var(--color-text-dim)]">Sin bloques.</p>
              )}
            </div>

            {formDay === weekday && (
              <form onSubmit={submit} className="flex flex-col gap-2 mt-2 pt-2 border-t border-[var(--color-border)]">
                <input
                  autoFocus
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="ej: Gym"
                  className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[var(--color-accent)]"
                />
                <div className="flex gap-1.5">
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                    className="flex-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                    className="flex-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-xs outline-none"
                  />
                </div>
                <div className="flex gap-1">
                  {COLORES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className="w-5 h-5 rounded-full border-2"
                      style={{ backgroundColor: c, borderColor: form.color === c ? 'white' : 'transparent' }}
                    />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <button type="submit" className="flex-1 bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] transition-colors rounded-lg py-1.5 text-xs font-medium">
                    Guardar
                  </button>
                  <button type="button" onClick={() => setFormDay(null)} className="px-2.5 rounded-lg text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]">
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
