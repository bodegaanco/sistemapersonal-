import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays } from 'lucide-react';
import api from '../api/client';
import Card from '../components/Card';
import {
  DIAS_CORTOS, startOfWeek, addDays, addMonths,
  toISODateOnly, getMonthGrid,
} from '../utils/dates';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const COLORES = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899'];

export default function Calendar() {
  const [viewMode, setViewMode] = useState('month'); // month | week | day
  const [anchor, setAnchor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(toISODateOnly(new Date()));
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm());

  function defaultForm() {
    const now = new Date();
    return {
      title: '',
      date: toISODateOnly(now),
      time: '09:00',
      all_day: false,
      repeat_rule: 'none',
      color: COLORES[0],
      description: '',
    };
  }

  const { rangeFrom, rangeTo } = useMemo(() => {
    if (viewMode === 'month') {
      const grid = getMonthGrid(anchor);
      return { rangeFrom: toISODateOnly(grid[0][0]), rangeTo: toISODateOnly(grid[grid.length - 1][6]) };
    }
    if (viewMode === 'week') {
      const start = startOfWeek(anchor);
      return { rangeFrom: toISODateOnly(start), rangeTo: toISODateOnly(addDays(start, 6)) };
    }
    const d = toISODateOnly(anchor);
    return { rangeFrom: d, rangeTo: d };
  }, [viewMode, anchor]);

  function loadEvents() {
    api.get(`/calendar/events?from=${rangeFrom}&to=${rangeTo}`).then(setEvents);
  }

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeFrom, rangeTo]);

  function eventsForDay(isoDate) {
    return events.filter((e) => e.occurrence_start.slice(0, 10) === isoDate);
  }

  function navigate(dir) {
    if (viewMode === 'month') setAnchor((a) => addMonths(a, dir));
    else if (viewMode === 'week') setAnchor((a) => addDays(a, dir * 7));
    else setAnchor((a) => addDays(a, dir));
  }

  function goToday() {
    setAnchor(new Date());
    setSelectedDay(toISODateOnly(new Date()));
  }

  function openNewEvent(isoDate) {
    setForm({ ...defaultForm(), date: isoDate });
    setShowForm(true);
  }

  async function submitEvent(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const start_date = form.all_day ? `${form.date}T00:00:00` : `${form.date}T${form.time}:00`;
    await api.post('/calendar/events', {
      title: form.title.trim(),
      description: form.description || null,
      start_date,
      all_day: form.all_day ? 1 : 0,
      repeat_rule: form.repeat_rule,
      color: form.color,
    });
    setShowForm(false);
    loadEvents();
  }

  async function removeEvent(id) {
    if (!confirm('¿Eliminar este evento? Si se repite, se eliminará por completo (todas sus ocurrencias).')) return;
    await api.delete(`/calendar/events/${id}`);
    loadEvents();
  }

  const title =
    viewMode === 'month'
      ? `${MESES[anchor.getMonth()]} ${anchor.getFullYear()}`
      : viewMode === 'week'
        ? `Semana del ${toISODateOnly(startOfWeek(anchor)).slice(8, 10)} de ${MESES[startOfWeek(anchor).getMonth()]}`
        : `${anchor.getDate()} de ${MESES[anchor.getMonth()]}, ${anchor.getFullYear()}`;

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 animate-enter">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={22} className="text-[var(--color-accent-strong)]" />
          <h1 className="text-2xl font-semibold tracking-tight">Calendario</h1>
        </div>
        <div className="flex gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1">
          {[['month', 'Mes'], ['week', 'Semana'], ['day', 'Día']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                viewMode === key ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)]">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium w-52">{title}</span>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)]">
            <ChevronRight size={18} />
          </button>
          <button onClick={goToday} className="text-xs text-[var(--color-accent-strong)] hover:underline ml-2">
            Hoy
          </button>
        </div>
        <button
          onClick={() => openNewEvent(selectedDay)}
          className="flex items-center gap-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] transition-colors px-3 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={15} /> Nuevo evento
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={submitEvent} className="flex flex-col gap-3">
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Título del evento"
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none"
              />
              {!form.all_day && (
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none"
                />
              )}
              <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <input
                  type="checkbox"
                  checked={form.all_day}
                  onChange={(e) => setForm((f) => ({ ...f, all_day: e.target.checked }))}
                />
                Todo el día
              </label>
              <select
                value={form.repeat_rule}
                onChange={(e) => setForm((f) => ({ ...f, repeat_rule: e.target.value }))}
                className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none"
              >
                <option value="none">No se repite</option>
                <option value="daily">Cada día</option>
                <option value="weekly">Cada semana</option>
                <option value="monthly">Cada mes</option>
              </select>
              <div className="flex gap-1">
                {COLORES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className="w-6 h-6 rounded-full border-2"
                    style={{ backgroundColor: c, borderColor: form.color === c ? 'white' : 'transparent' }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] transition-colors px-4 py-2 rounded-lg text-sm font-medium"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      {viewMode === 'month' && (
        <MonthView
          anchor={anchor}
          eventsForDay={eventsForDay}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      )}
      {viewMode === 'week' && (
        <WeekView anchor={anchor} eventsForDay={eventsForDay} onAddDay={openNewEvent} onRemove={removeEvent} />
      )}
      {viewMode === 'day' && (
        <DayAgenda isoDate={toISODateOnly(anchor)} events={eventsForDay(toISODateOnly(anchor))} onRemove={removeEvent} />
      )}

      {viewMode === 'month' && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
            Agenda del {selectedDay}
          </h2>
          <DayAgenda isoDate={selectedDay} events={eventsForDay(selectedDay)} onRemove={removeEvent} />
        </div>
      )}
    </div>
  );
}

function MonthView({ anchor, eventsForDay, selectedDay, onSelectDay }) {
  const weeks = getMonthGrid(anchor);
  const currentMonth = anchor.getMonth();
  const todayIso = toISODateOnly(new Date());

  return (
    <Card className="!p-3">
      <div className="grid grid-cols-7 mb-2">
        {DIAS_CORTOS.map((d) => (
          <div key={d} className="text-center text-[11px] text-[var(--color-text-dim)] uppercase py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((date) => {
          const iso = toISODateOnly(date);
          const dayEvents = eventsForDay(iso);
          const isOtherMonth = date.getMonth() !== currentMonth;
          const isToday = iso === todayIso;
          const isSelected = iso === selectedDay;
          return (
            <button
              key={iso}
              onClick={() => onSelectDay(iso)}
              className={`text-left rounded-lg p-1.5 min-h-[76px] border transition-colors ${
                isSelected ? 'border-[var(--color-accent)]' : 'border-transparent'
              } ${isOtherMonth ? 'opacity-35' : ''} hover:bg-[var(--color-surface-hover)]`}
            >
              <span className={`text-xs inline-flex w-5 h-5 items-center justify-center rounded-full ${
                isToday ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)]'
              }`}>
                {date.getDate()}
              </span>
              <div className="flex flex-col gap-0.5 mt-1">
                {dayEvents.slice(0, 3).map((ev, i) => (
                  <span
                    key={`${ev.id}-${i}`}
                    className="text-[10px] px-1 py-0.5 rounded truncate"
                    style={{ backgroundColor: `${ev.color}26`, color: ev.color }}
                  >
                    {ev.title}
                  </span>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-[var(--color-text-dim)]">+{dayEvents.length - 3} más</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function WeekView({ anchor, eventsForDay, onAddDay, onRemove }) {
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
      {days.map((date) => {
        const iso = toISODateOnly(date);
        const dayEvents = eventsForDay(iso);
        return (
          <Card key={iso} className="!p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{DIAS_CORTOS[(date.getDay() + 6) % 7]} {date.getDate()}</span>
              <button onClick={() => onAddDay(iso)} className="text-[var(--color-text-dim)] hover:text-[var(--color-accent-strong)]">
                <Plus size={13} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {dayEvents.map((ev, i) => (
                <div key={`${ev.id}-${i}`} className="text-[11px] px-2 py-1 rounded flex items-center justify-between gap-1"
                  style={{ backgroundColor: `${ev.color}22`, color: ev.color }}>
                  <span className="truncate">{ev.title}</span>
                  <button onClick={() => onRemove(ev.id)} className="opacity-60 hover:opacity-100">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              {dayEvents.length === 0 && <span className="text-[11px] text-[var(--color-text-dim)]">Sin eventos</span>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function DayAgenda({ events, onRemove }) {
  const sorted = [...events].sort((a, b) => new Date(a.occurrence_start) - new Date(b.occurrence_start));
  return (
    <div className="flex flex-col gap-2">
      {sorted.map((ev, i) => (
        <Card key={`${ev.id}-${i}`} className="!p-3.5 flex items-center gap-3">
          <span className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
          <div className="flex-1">
            <p className="text-sm font-medium">{ev.title}</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {ev.all_day ? 'Todo el día' : new Date(ev.occurrence_start).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
              {ev.repeat_rule !== 'none' && ' · se repite'}
            </p>
          </div>
          <button onClick={() => onRemove(ev.id)} className="text-[var(--color-text-dim)] hover:text-[var(--color-danger)]">
            <Trash2 size={14} />
          </button>
        </Card>
      ))}
      {sorted.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-8">Sin eventos.</p>
      )}
    </div>
  );
}
