import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import api from '../api/client';
import Card from '../components/Card';
import { fechaLarga } from '../utils/dates';

export default function Checklist() {
  const [items, setItems] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const dragId = useRef(null);

  const load = () => api.get('/checklist').then((d) => setItems(d.items));

  useEffect(() => {
    load();
  }, []);

  const total = items.length;
  const done = items.filter((i) => i.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  async function toggle(item) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i)));
    await api.post(`/checklist/${item.id}/toggle`);
  }

  async function addItem(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await api.post('/checklist', { title: newTitle.trim() });
    setNewTitle('');
    load();
  }

  async function removeItem(id) {
    if (!confirm('¿Eliminar este ítem del checklist diario? Se perderá del historial futuro.')) return;
    await api.delete(`/checklist/${id}`);
    load();
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditValue(item.title);
  }

  async function saveEdit(id) {
    if (editValue.trim()) {
      await api.put(`/checklist/${id}`, { title: editValue.trim() });
    }
    setEditingId(null);
    load();
  }

  function handleDragStart(id) {
    dragId.current = id;
  }

  async function handleDrop(targetId) {
    const sourceId = dragId.current;
    if (sourceId === targetId) return;
    const ids = items.map((i) => i.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    ids.splice(from, 1);
    ids.splice(to, 0, sourceId);
    setItems(ids.map((id) => items.find((i) => i.id === id)));
    await api.post('/checklist/reorder', { order: ids });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-10 py-10 animate-enter">
      <div className="mb-6">
        <p className="text-sm text-[var(--color-text-muted)] mb-1">{fechaLarga()}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Checklist diario</h1>
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--color-text-muted)]">Progreso de hoy</span>
          <span className="font-mono text-sm text-[var(--color-accent-strong)]">{done}/{total} · {pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] transition-all duration-500 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>

      <Card className="!p-2 mb-6">
        {items.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(item.id)}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <GripVertical size={15} className="text-[var(--color-text-dim)] cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
            <input
              type="checkbox"
              className="task-check"
              checked={item.completed}
              onChange={() => toggle(item)}
            />
            <span className="text-base shrink-0">{item.icon}</span>

            {editingId === item.id ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => saveEdit(item.id)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)}
                className="flex-1 bg-transparent border-b border-[var(--color-accent)] outline-none text-sm py-0.5"
              />
            ) : (
              <span
                onClick={() => startEdit(item)}
                className={`flex-1 text-sm cursor-text ${item.completed ? 'line-through text-[var(--color-text-dim)]' : ''}`}
              >
                {item.title}
              </span>
            )}

            <button
              onClick={() => removeItem(item.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-dim)] hover:text-[var(--color-danger)]"
              aria-label={`Eliminar ${item.title}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">
            No tienes ítems fijos todavía. Agrega el primero abajo.
          </p>
        )}
      </Card>

      <form onSubmit={addItem} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Agregar nuevo hábito fijo, ej: Estirar 10 minutos"
          className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] transition-colors"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] transition-colors px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <Plus size={16} /> Agregar
        </button>
      </form>
    </div>
  );
}
