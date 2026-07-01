import { useEffect, useState } from 'react';
import { UtensilsCrossed, Plus, Trash2, ShoppingCart } from 'lucide-react';
import api from '../api/client';
import Card from '../components/Card';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const TIPOS = [
  ['desayuno', 'Desayuno'],
  ['almuerzo', 'Almuerzo'],
  ['cena', 'Cena'],
  ['snack', 'Snack'],
];

export default function Meals() {
  const [meals, setMeals] = useState([]);
  const [editing, setEditing] = useState(null); // `${weekday}-${meal_type}` o null
  const [form, setForm] = useState({ title: '', ingredients: '' });
  const [toast, setToast] = useState('');

  function load() {
    api.get('/meals').then(setMeals);
  }

  useEffect(() => {
    load();
  }, []);

  function mealFor(weekday, mealType) {
    return meals.find((m) => m.weekday === weekday && m.meal_type === mealType);
  }

  function openEdit(weekday, mealType) {
    const existing = mealFor(weekday, mealType);
    setForm({ title: existing?.title || '', ingredients: existing?.ingredients || '' });
    setEditing(`${weekday}-${mealType}`);
  }

  async function submit(e) {
    e.preventDefault();
    const [weekday, mealType] = editing.split('-');
    if (!form.title.trim()) return;
    const existing = mealFor(Number(weekday), mealType);

    if (existing) {
      await api.put(`/meals/${existing.id}`, form);
    } else {
      await api.post('/meals', { weekday: Number(weekday), meal_type: mealType, ...form });
    }
    setEditing(null);
    load();
  }

  async function removeMeal(id) {
    await api.delete(`/meals/${id}`);
    load();
  }

  async function sendToShopping(meal) {
    const lines = (meal.ingredients || '').split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setToast('Esta comida no tiene ingredientes escritos.');
      setTimeout(() => setToast(''), 2000);
      return;
    }
    await api.post('/shopping/bulk', { items: lines, defaultCategory: 'Otros' });
    setToast(`Se agregaron ${lines.length} ingrediente(s) a Compras ✓`);
    setTimeout(() => setToast(''), 2000);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 animate-enter">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={22} className="text-[var(--color-accent-strong)]" />
          <h1 className="text-2xl font-semibold tracking-tight">Comidas semanales</h1>
        </div>
        {toast && <span className="text-xs text-[var(--color-success)]">{toast}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
        {DIAS.map((dia, weekday) => (
          <Card key={dia} className="!p-3 flex flex-col gap-2">
            <span className="text-xs font-medium text-center mb-1">{dia}</span>
            {TIPOS.map(([mealType, label]) => {
              const meal = mealFor(weekday, mealType);
              const key = `${weekday}-${mealType}`;
              return (
                <div key={mealType} className="bg-[var(--color-bg-elevated)] rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[var(--color-text-dim)] uppercase">{label}</span>
                    {meal ? (
                      <div className="flex gap-1">
                        <button onClick={() => sendToShopping(meal)} title="Agregar ingredientes a Compras" className="text-[var(--color-text-dim)] hover:text-[var(--color-accent-strong)]">
                          <ShoppingCart size={11} />
                        </button>
                        <button onClick={() => removeMeal(meal.id)} className="text-[var(--color-text-dim)] hover:text-[var(--color-danger)]">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => openEdit(weekday, mealType)} className="text-[var(--color-text-dim)] hover:text-[var(--color-accent-strong)]">
                        <Plus size={12} />
                      </button>
                    )}
                  </div>

                  {editing === key ? (
                    <form onSubmit={submit} className="flex flex-col gap-1.5">
                      <input
                        autoFocus
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Ej: Pollo con arroz"
                        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-2 py-1 text-xs outline-none"
                      />
                      <textarea
                        value={form.ingredients}
                        onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))}
                        placeholder="Ingredientes, uno por línea"
                        rows={2}
                        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-2 py-1 text-xs outline-none resize-none"
                      />
                      <div className="flex gap-1">
                        <button type="submit" className="flex-1 bg-[var(--color-accent)] rounded py-1 text-[11px]">Guardar</button>
                        <button type="button" onClick={() => setEditing(null)} className="px-2 text-[11px] text-[var(--color-text-muted)]">Cancelar</button>
                      </div>
                    </form>
                  ) : meal ? (
                    <button onClick={() => openEdit(weekday, mealType)} className="text-xs text-left w-full">
                      {meal.title}
                    </button>
                  ) : (
                    <span className="text-[11px] text-[var(--color-text-dim)]">Sin definir</span>
                  )}
                </div>
              );
            })}
          </Card>
        ))}
      </div>
    </div>
  );
}
