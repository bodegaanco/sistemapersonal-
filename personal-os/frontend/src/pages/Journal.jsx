import { useEffect, useState } from 'react';
import { BookOpen, Smile, Battery, Zap } from 'lucide-react';
import api from '../api/client';
import Card from '../components/Card';
import { todayISO } from '../utils/dates';

const CARAS_ANIMO = ['😞', '😕', '😐', '🙂', '😄'];

export default function Journal() {
  const [date, setDate] = useState(todayISO());
  const [entry, setEntry] = useState(emptyEntry());
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState(false);

  function emptyEntry() {
    return { how_was_day: '', what_went_well: '', what_to_improve: '', mood: 3, energy: 3, productivity: 3 };
  }

  function loadHistory() {
    api.get('/journal').then(setHistory);
  }

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    api.get(`/journal/${date}`).then((e) => setEntry(e || emptyEntry()));
  }, [date]);

  async function save(e) {
    e.preventDefault();
    await api.put(`/journal/${date}`, entry);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    loadHistory();
  }

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-10 py-10 animate-enter">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={22} className="text-[var(--color-accent-strong)]" />
          <h1 className="text-2xl font-semibold tracking-tight">Diario</h1>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none"
        />
      </div>

      <Card className="mb-6">
        <form onSubmit={save} className="flex flex-col gap-4">
          <Field label="¿Cómo estuvo mi día?" value={entry.how_was_day} onChange={(v) => setEntry((e) => ({ ...e, how_was_day: v }))} />
          <Field label="¿Qué hice bien?" value={entry.what_went_well} onChange={(v) => setEntry((e) => ({ ...e, what_went_well: v }))} />
          <Field label="¿Qué puedo mejorar?" value={entry.what_to_improve} onChange={(v) => setEntry((e) => ({ ...e, what_to_improve: v }))} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <Slider icon={Smile} label="Ánimo" value={entry.mood} onChange={(v) => setEntry((e) => ({ ...e, mood: v }))} display={CARAS_ANIMO[entry.mood - 1]} />
            <Slider icon={Zap} label="Energía" value={entry.energy} onChange={(v) => setEntry((e) => ({ ...e, energy: v }))} />
            <Slider icon={Battery} label="Productividad" value={entry.productivity} onChange={(v) => setEntry((e) => ({ ...e, productivity: v }))} />
          </div>

          <button
            type="submit"
            className="self-start bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] transition-colors px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            {saved ? 'Guardado ✓' : 'Guardar entrada'}
          </button>
        </form>
      </Card>

      <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
        Entradas anteriores
      </h2>
      <div className="flex flex-col gap-2">
        {history.filter((h) => h.date !== date).map((h) => (
          <Card key={h.date} className="!p-4 cursor-pointer hover:bg-[var(--color-surface-hover)]" onClick={() => setDate(h.date)}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{h.date}</span>
              <span className="text-lg">{CARAS_ANIMO[(h.mood || 3) - 1]}</span>
            </div>
            {h.how_was_day && <p className="text-xs text-[var(--color-text-muted)] truncate">{h.how_was_day}</p>}
          </Card>
        ))}
        {history.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-8">Aún no tienes entradas.</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] resize-none"
      />
    </div>
  );
}

function Slider({ icon: Icon, label, value, onChange, display }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <Icon size={13} /> {label}
        </span>
        <span className="text-sm">{display || value}</span>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
