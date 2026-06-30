import { useEffect, useState } from 'react';
import { Flame, Plus, Trophy } from 'lucide-react';
import api from '../api/client';
import Card from '../components/Card';

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = () => api.get('/habits').then(setHabits);

  useEffect(() => {
    load();
  }, []);

  async function toggle(habit) {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id
          ? {
              ...h,
              completedToday: !h.completedToday,
              currentStreak: h.completedToday ? Math.max(0, h.currentStreak - 1) : h.currentStreak + 1,
            }
          : h
      )
    );
    await api.post(`/habits/${habit.id}/toggle`);
    load();
  }

  async function addHabit(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await api.post('/habits', { title: newTitle.trim() });
    setNewTitle('');
    setShowForm(false);
    load();
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-10 animate-enter">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Hábitos</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors px-3 py-2 rounded-lg text-sm"
        >
          <Plus size={15} /> Nuevo hábito
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={addHabit} className="flex gap-2">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nombre del hábito, ej: Estudiar inglés"
              className="flex-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <button
              type="submit"
              className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] transition-colors px-4 py-2.5 rounded-xl text-sm font-medium"
            >
              Crear
            </button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {habits.map((habit) => (
          <Card key={habit.id} className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{habit.icon}</span>
                <span className="font-medium text-sm">{habit.title}</span>
              </div>
              <button
                onClick={() => toggle(habit)}
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${
                  habit.completedToday
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
                }`}
                aria-label={`Marcar ${habit.title} de hoy`}
              >
                <Flame size={16} className={habit.completedToday ? 'text-white' : 'text-[var(--color-text-dim)]'} />
              </button>
            </div>

            <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${habit.percentage30d}%`, backgroundColor: habit.color }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
                <Flame size={12} style={{ color: habit.color }} />
                Racha actual: <span className="font-mono text-[var(--color-text)]">{habit.currentStreak}</span>
              </span>
              <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
                <Trophy size={12} />
                Máxima: <span className="font-mono text-[var(--color-text)]">{habit.maxStreak}</span>
              </span>
              <span className="font-mono text-[var(--color-text-muted)]">{habit.percentage30d}% / 30d</span>
            </div>
          </Card>
        ))}
        {habits.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] col-span-2 text-center py-10">
            Aún no tienes hábitos. Crea el primero arriba.
          </p>
        )}
      </div>
    </div>
  );
}
