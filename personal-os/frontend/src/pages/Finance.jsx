import { useEffect, useState } from 'react';
import { Wallet, Plus, Trash2, Search, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../api/client';
import Card from '../components/Card';
import { todayISO } from '../utils/dates';

const COLORES = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899'];

function formatCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);
}

export default function Finance() {
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [breakdown, setBreakdown] = useState([]);

  const [form, setForm] = useState({ type: 'gasto', amount: '', category_id: '', description: '', date: todayISO() });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'gasto', color: COLORES[0] });

  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  function loadAll() {
    api.get('/finance/summary').then(setSummary);
    api.get('/finance/categories').then(setCategories);
    api.get('/finance/transactions').then(setTransactions);
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    api.get(`/finance/summary/by-category?from=${from}&to=${to}&type=gasto`).then(setBreakdown);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const categoriesForType = categories.filter((c) => c.type === form.type);

  async function submitTransaction(e) {
    e.preventDefault();
    if (!form.amount) return;
    await api.post('/finance/transactions', {
      ...form,
      amount: Number(form.amount),
      category_id: form.category_id || null,
    });
    setForm({ type: form.type, amount: '', category_id: '', description: '', date: todayISO() });
    loadAll();
  }

  async function submitCategory(e) {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    const created = await api.post('/finance/categories', newCategory);
    setShowNewCategory(false);
    setNewCategory({ name: '', type: 'gasto', color: COLORES[0] });
    await loadAll();
    setForm((f) => ({ ...f, category_id: created.id, type: created.type }));
  }

  async function removeTransaction(id) {
    if (!confirm('¿Eliminar este movimiento?')) return;
    await api.delete(`/finance/transactions/${id}`);
    loadAll();
  }

  const filtered = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (search && !(t.description || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const maxBreakdown = Math.max(...breakdown.map((b) => b.total), 1);

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-10 animate-enter">
      <div className="mb-6 flex items-center gap-2">
        <Wallet size={22} className="text-[var(--color-accent-strong)]" />
        <h1 className="text-2xl font-semibold tracking-tight">Finanzas</h1>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <SaldoCard label="Hoy" data={summary.day} />
          <SaldoCard label="Esta semana" data={summary.week} />
          <SaldoCard label="Este mes" data={summary.month} />
          <SaldoCard label="Este año" data={summary.year} />
        </div>
      )}

      <Card className="mb-6">
        <h2 className="text-sm font-medium mb-4">Nuevo movimiento</h2>
        <form onSubmit={submitTransaction} className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, category_id: '' }))}
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none"
            >
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
              <option value="transferencia">Transferencia</option>
            </select>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="Monto"
              className="w-32 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm outline-none"
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none"
            />
            <select
              value={form.category_id}
              onChange={(e) => {
                if (e.target.value === '__new__') setShowNewCategory(true);
                else setForm((f) => ({ ...f, category_id: e.target.value }));
              }}
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none flex-1 min-w-[140px]"
            >
              <option value="">Sin categoría</option>
              {categoriesForType.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="__new__">+ Nueva categoría...</option>
            </select>
          </div>

          {showNewCategory && (
            <div className="flex flex-wrap items-center gap-2 bg-[var(--color-bg-elevated)] p-3 rounded-xl border border-[var(--color-border)]">
              <input
                autoFocus
                value={newCategory.name}
                onChange={(e) => setNewCategory((c) => ({ ...c, name: e.target.value, type: form.type }))}
                placeholder="Nombre de la categoría"
                className="flex-1 bg-transparent border-b border-[var(--color-border)] text-sm outline-none py-1"
              />
              <div className="flex gap-1">
                {COLORES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCategory((nc) => ({ ...nc, color: c }))}
                    className="w-5 h-5 rounded-full border-2"
                    style={{ backgroundColor: c, borderColor: newCategory.color === c ? 'white' : 'transparent' }}
                  />
                ))}
              </div>
              <button onClick={submitCategory} type="button" className="text-xs bg-[var(--color-accent)] px-3 py-1.5 rounded-lg">
                Crear
              </button>
            </div>
          )}

          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Descripción (ej: Supermercado)"
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />

          <button
            type="submit"
            className="self-start bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] transition-colors px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            Guardar
          </button>
        </form>
      </Card>

      {breakdown.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-sm font-medium mb-4">Gastos por categoría (este mes)</h2>
          <div className="flex flex-col gap-2.5">
            {breakdown.map((b) => (
              <div key={b.id || 'none'}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{b.name}</span>
                  <span className="font-mono text-[var(--color-text-muted)]">{formatCLP(b.total)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(b.total / maxBreakdown) * 100}%`, backgroundColor: b.color || '#6b7280' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1">
          {[['all', 'Todos'], ['ingreso', 'Ingresos'], ['gasto', 'Gastos'], ['transferencia', 'Transferencias']].map(([key, label]) => (
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
        <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-1.5">
          <Search size={13} className="text-[var(--color-text-dim)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="bg-transparent text-xs outline-none w-32"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((t) => (
          <Card key={t.id} className="!p-3.5 flex items-center gap-3">
            {t.type === 'ingreso' ? (
              <TrendingUp size={16} className="text-[var(--color-success)] shrink-0" />
            ) : t.type === 'gasto' ? (
              <TrendingDown size={16} className="text-[var(--color-danger)] shrink-0" />
            ) : (
              <Wallet size={16} className="text-[var(--color-text-muted)] shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{t.description || t.category?.name || 'Movimiento'}</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {t.date}{t.category ? ` · ${t.category.name}` : ''}
              </p>
            </div>
            <span className={`font-mono text-sm ${t.type === 'ingreso' ? 'text-[var(--color-success)]' : t.type === 'gasto' ? 'text-[var(--color-danger)]' : ''}`}>
              {t.type === 'gasto' ? '-' : t.type === 'ingreso' ? '+' : ''}{formatCLP(t.amount)}
            </span>
            <button onClick={() => removeTransaction(t.id)} className="text-[var(--color-text-dim)] hover:text-[var(--color-danger)]">
              <Trash2 size={14} />
            </button>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-10">No hay movimientos todavía.</p>
        )}
      </div>
    </div>
  );
}

function SaldoCard({ label, data }) {
  const positive = data.saldo >= 0;
  return (
    <Card className="!p-3.5 flex flex-col gap-1">
      <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">{label}</span>
      <span className={`font-mono text-lg ${positive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
        {formatCLP(data.saldo)}
      </span>
    </Card>
  );
}
