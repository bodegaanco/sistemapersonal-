import { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar, Flag } from 'lucide-react';
import api from '../api/client';
import Card from '../components/Card';
import { todayISO } from '../utils/dates';

const PRIORIDADES = {
  alta: { label: 'Alta', color: 'var(--color-danger)' },
  media: { label: 'Media', color: 'var(--color-warning)' },
  baja: { label: 'Baja', color: 'var(--color-text-dim)' },
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('media');
  const [dueDate, setDueDate] = useState(todayISO());
  const [filter, setFilter] = useState('all');

  const load = () => api.get('/tasks').then(setTasks);

  useEffect(() => {
    load();
  }, []);

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await api.post('/tasks', { title: title.trim(), priority, due_date: dueDate || null });
    setTitle('');
    load();
  }

  async function toggleComplete(task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: t.completed ? 0 : 1 } : t)));
    await api.post(`/tasks/${task.id}/complete`);
  }

  async function removeTask(id) {
    if (!confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) return;
    await api.delete(`/tasks/${id}`);
    load();
  }

  async function moveTask(id, newDate) {
    await api.post(`/tasks/${id}/move`, { due_date: newDate });
    load();
  }

  const filtered = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'done') return !!t.completed;
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-10 py-10 animate-enter">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Tareas</h1>
        <div className="flex gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1">
          {[['all', 'Todas'], ['pending', 'Pendientes'], ['done', 'Hechas']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                filter === key ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Card className="mb-6">
        <form onSubmit={addTask} className="flex flex-col gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nueva tarea, ej: Ir al banco"
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] transition-colors"
          />
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none"
            >
              <option value="alta">Prioridad alta</option>
              <option value="media">Prioridad media</option>
              <option value="baja">Prioridad baja</option>
            </select>
            <input
              type="date"
              value={dueDate || ''}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none"
            />
            <button
              type="submit"
              className="ml-auto flex items-center gap-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] transition-colors px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plus size={16} /> Agregar
            </button>
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {filtered.map((task) => (
          <Card key={task.id} className="!p-3.5 flex items-center gap-3">
            <input
              type="checkbox"
              className="task-check"
              checked={!!task.completed}
              onChange={() => toggleComplete(task)}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${task.completed ? 'line-through text-[var(--color-text-dim)]' : ''}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-[11px]" style={{ color: PRIORIDADES[task.priority]?.color }}>
                  <Flag size={11} /> {PRIORIDADES[task.priority]?.label}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                  <Calendar size={11} />
                  <input
                    type="date"
                    value={task.due_date || ''}
                    onChange={(e) => moveTask(task.id, e.target.value)}
                    className="bg-transparent outline-none cursor-pointer"
                  />
                </span>
              </div>
            </div>
            <button
              onClick={() => removeTask(task.id)}
              className="text-[var(--color-text-dim)] hover:text-[var(--color-danger)] transition-colors"
              aria-label={`Eliminar ${task.title}`}
            >
              <Trash2 size={15} />
            </button>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-10">
            No hay tareas {filter === 'pending' ? 'pendientes' : filter === 'done' ? 'completadas' : ''} todavía.
          </p>
        )}
      </div>
    </div>
  );
}
