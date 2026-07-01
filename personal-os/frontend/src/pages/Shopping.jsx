import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Trash2, Sparkles } from 'lucide-react';
import api from '../api/client';
import Card from '../components/Card';

const CATEGORIAS = [
  'Frutas y verduras', 'Carnes', 'Lácteos y huevos', 'Panadería',
  'Despensa', 'Congelados', 'Bebidas', 'Limpieza', 'Otros',
];

export default function Shopping() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('Otros');

  function load() {
    api.get('/shopping').then(setItems);
  }

  useEffect(() => {
    load();
  }, []);

  async function addItem(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await api.post('/shopping', { name: name.trim(), quantity: quantity || null, category });
    setName('');
    setQuantity('');
    load();
  }

  async function toggle(item) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: i.checked ? 0 : 1 } : i)));
    await api.post(`/shopping/${item.id}/toggle`);
  }

  async function removeItem(id) {
    await api.delete(`/shopping/${id}`);
    load();
  }

  async function clearChecked() {
    if (!confirm('¿Quitar de la lista todo lo que ya marcaste como comprado?')) return;
    await api.delete('/shopping/checked/all');
    load();
  }

  const pending = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const grouped = pending.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-10 py-10 animate-enter">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={22} className="text-[var(--color-accent-strong)]" />
          <h1 className="text-2xl font-semibold tracking-tight">Compras</h1>
        </div>
        {checked.length > 0 && (
          <button onClick={clearChecked} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">
            Limpiar comprados ({checked.length})
          </button>
        )}
      </div>

      <Card className="mb-6">
        <form onSubmit={addItem} className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Tomates"
            className="flex-1 min-w-[140px] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Cantidad"
            className="w-24 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm outline-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none"
          >
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] transition-colors px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            <Plus size={16} /> Agregar
          </button>
        </form>
      </Card>

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="mb-5">
          <h2 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">{cat}</h2>
          <Card className="!p-2">
            {catItems.map((item) => (
              <div key={item.id} className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--color-surface-hover)]">
                <input type="checkbox" className="task-check" checked={!!item.checked} onChange={() => toggle(item)} />
                <span className="flex-1 text-sm">{item.name}</span>
                {item.quantity && <span className="text-xs font-mono text-[var(--color-text-muted)]">{item.quantity}</span>}
                <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-[var(--color-text-dim)] hover:text-[var(--color-danger)] transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </Card>
        </div>
      ))}

      {pending.length === 0 && checked.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-10">
          Tu lista de compras está vacía. También puedes mandar ingredientes desde <strong>Comidas semanales</strong>{' '}
          <Sparkles size={12} className="inline text-[var(--color-accent-strong)]" />.
        </p>
      )}

      {checked.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Comprado</h2>
          <Card className="!p-2">
            {checked.map((item) => (
              <div key={item.id} className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--color-surface-hover)]">
                <input type="checkbox" className="task-check" checked onChange={() => toggle(item)} />
                <span className="flex-1 text-sm line-through text-[var(--color-text-dim)]">{item.name}</span>
                <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-[var(--color-text-dim)] hover:text-[var(--color-danger)] transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
