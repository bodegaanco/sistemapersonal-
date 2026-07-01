import { useEffect, useState } from 'react';
import { Target, Plus, Trash2, PiggyBank } from 'lucide-react';
import api from '../api/client';
import Card from '../components/Card';

function formatCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);
}

const ICONOS = ['🎯', '🏍️', '🚗', '✈️', '🏠', '💻', '🛠️', '💍', '🎓', '📱'];

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', target_amount: '', deadline: '', icon: '🎯' });

  function load() {
    api.get('/goals').then(setGoals);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.target_amount) return;
    await api.post('/goals', { ...form, deadline: form.deadline || null });
    setForm({ title: '', target_amount: '', deadline: '', icon: '🎯' });
    setShowForm(false);
    load();
  }

  async function contribute(goal) {
    const amountStr = prompt(`¿Cuánto quieres agregar a "${goal.title}"? (usa negativo para retirar)`, '10000');
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (Number.isNaN(amount) || amount === 0) return;
    await api.post(`/goals/${goal.id}/contribute`, { amount });
    load();
  }

  async function removeGoal(id) {
    if (!confirm('¿Eliminar este objetivo? Se perderá el historial de aportes.')) return;
    await api.delete(`/goals/${id}`);
    load();
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-10 animate-enter">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={22} className="text-[var(--color-accent-strong)]" />
          <h1 className="text-2xl font-semibold tracking-tight">Objetivos</h1>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] transition-colors px-3 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={15} /> Nuevo objetivo
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex gap-1 flex-wrap">
              {ICONOS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border ${
                    form.icon === ic ? 'border-[var(--color-accent)] bg-[var(--color-surface-hover)]' : 'border-transparent'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Comprar moto"
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={form.target_amount}
                onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))}
                placeholder="Monto objetivo"
                className="flex-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm outline-none"
              />
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              className="self-start bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] transition-colors px-4 py-2.5 rounded-xl text-sm font-medium"
            >
              Crear objetivo
            </button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
          return (
            <Card key={g.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{g.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{g.title}</p>
                    {g.deadline && <p className="text-[11px] text-[var(--color-text-muted)]">Meta: {g.deadline}</p>}
                  </div>
                </div>
                <button onClick={() => removeGoal(g.id)} className="text-[var(--color-text-dim)] hover:text-[var(--color-danger)]">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[var(--color-text-muted)]">
                  {formatCLP(g.current_amount)} <span className="text-[var(--color-text-dim)]">/ {formatCLP(g.target_amount)}</span>
                </span>
                <span className="font-mono text-[var(--color-accent-strong)]">{pct}%</span>
              </div>

              {g.completed ? (
                <span className="text-xs text-[var(--color-success)] font-medium">🎉 ¡Objetivo cumplido!</span>
              ) : (
                <button
                  onClick={() => contribute(g)}
                  className="self-start flex items-center gap-1.5 text-xs bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors px-3 py-1.5 rounded-lg"
                >
                  <PiggyBank size={13} /> Agregar dinero
                </button>
              )}
            </Card>
          );
        })}
        {goals.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] col-span-2 text-center py-10">
            Aún no tienes objetivos. Crea el primero arriba.
          </p>
        )}
      </div>
    </div>
  );
}
