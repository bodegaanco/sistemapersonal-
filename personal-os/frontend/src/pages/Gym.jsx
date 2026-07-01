import { useEffect, useState } from 'react';
import { Plus, Trash2, Dumbbell, TrendingUp } from 'lucide-react';
import api from '../api/client';
import Card from '../components/Card';
import MiniLineChart from '../components/MiniLineChart';
import { todayISO } from '../utils/dates';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function Gym() {
  const [routines, setRoutines] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [exerciseNames, setExerciseNames] = useState([]);

  const [routineDrafts, setRoutineDrafts] = useState({});
  const [sessionDate, setSessionDate] = useState(todayISO());
  const [sessionRoutineId, setSessionRoutineId] = useState('');
  const [exercises, setExercises] = useState([{ exercise: '', sets: '', reps: '', weight: '', notes: '' }]);

  const [progressExercise, setProgressExercise] = useState('');
  const [progressData, setProgressData] = useState([]);

  function loadAll() {
    api.get('/gym/routines').then(setRoutines);
    api.get('/gym/sessions').then(setSessions);
    api.get('/gym/exercises').then(setExerciseNames);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!progressExercise) return setProgressData([]);
    api.get(`/gym/progress?exercise=${encodeURIComponent(progressExercise)}`).then(setProgressData);
  }, [progressExercise]);

  function routineForDay(weekday) {
    return routines.find((r) => r.weekday === weekday);
  }

  async function saveRoutine(weekday) {
    const name = (routineDrafts[weekday] ?? routineForDay(weekday)?.name ?? '').trim();
    const existing = routineForDay(weekday);
    if (!name) {
      if (existing) await api.delete(`/gym/routines/${existing.id}`);
    } else if (existing) {
      await api.put(`/gym/routines/${existing.id}`, { name });
    } else {
      await api.post('/gym/routines', { weekday, name });
    }
    loadAll();
  }

  function updateExerciseField(idx, field, value) {
    setExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex)));
  }

  function addExerciseRow() {
    setExercises((prev) => [...prev, { exercise: '', sets: '', reps: '', weight: '', notes: '' }]);
  }

  function removeExerciseRow(idx) {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  }

  async function saveSession(e) {
    e.preventDefault();
    const validExercises = exercises
      .filter((ex) => ex.exercise.trim())
      .map((ex) => ({
        exercise: ex.exercise.trim(),
        sets: ex.sets ? Number(ex.sets) : null,
        reps: ex.reps ? Number(ex.reps) : null,
        weight: ex.weight ? Number(ex.weight) : null,
        notes: ex.notes || null,
      }));
    if (validExercises.length === 0) return;

    await api.post('/gym/sessions', {
      date: sessionDate,
      routine_id: sessionRoutineId || null,
      exercises: validExercises,
    });

    setExercises([{ exercise: '', sets: '', reps: '', weight: '', notes: '' }]);
    loadAll();
  }

  async function deleteSession(id) {
    if (!confirm('¿Eliminar este entrenamiento del historial?')) return;
    await api.delete(`/gym/sessions/${id}`);
    loadAll();
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-10 animate-enter">
      <div className="mb-6 flex items-center gap-2">
        <Dumbbell size={22} className="text-[var(--color-accent-strong)]" />
        <h1 className="text-2xl font-semibold tracking-tight">Gym</h1>
      </div>

      {/* Rutina semanal */}
      <Card className="mb-6">
        <h2 className="text-sm font-medium mb-4">Rutina semanal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DIAS.map((dia, weekday) => (
            <div key={dia} className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)] w-20 shrink-0">{dia}</span>
              <input
                defaultValue={routineForDay(weekday)?.name || ''}
                onChange={(e) => setRoutineDrafts((d) => ({ ...d, [weekday]: e.target.value }))}
                onBlur={() => saveRoutine(weekday)}
                placeholder="ej: Pecho"
                className="flex-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Registrar entrenamiento */}
      <Card className="mb-6">
        <h2 className="text-sm font-medium mb-4">Registrar entrenamiento</h2>
        <form onSubmit={saveSession} className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none"
            />
            <select
              value={sessionRoutineId}
              onChange={(e) => setSessionRoutineId(e.target.value)}
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none"
            >
              <option value="">Sin rutina asociada</option>
              {routines.map((r) => (
                <option key={r.id} value={r.id}>{DIAS[r.weekday]} · {r.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            {exercises.map((ex, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2">
                <input
                  list="exercise-names"
                  value={ex.exercise}
                  onChange={(e) => updateExerciseField(idx, 'exercise', e.target.value)}
                  placeholder="Ejercicio, ej: Press banca"
                  className="flex-1 min-w-[140px] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                />
                <input
                  type="number"
                  value={ex.sets}
                  onChange={(e) => updateExerciseField(idx, 'sets', e.target.value)}
                  placeholder="Series"
                  className="w-20 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-2 py-2 text-sm outline-none"
                />
                <input
                  type="number"
                  value={ex.reps}
                  onChange={(e) => updateExerciseField(idx, 'reps', e.target.value)}
                  placeholder="Reps"
                  className="w-20 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-2 py-2 text-sm outline-none"
                />
                <input
                  type="number"
                  value={ex.weight}
                  onChange={(e) => updateExerciseField(idx, 'weight', e.target.value)}
                  placeholder="Kg"
                  className="w-20 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-2 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeExerciseRow(idx)}
                  className="text-[var(--color-text-dim)] hover:text-[var(--color-danger)]"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <datalist id="exercise-names">
              {exerciseNames.map((name) => <option key={name} value={name} />)}
            </datalist>

            <button
              type="button"
              onClick={addExerciseRow}
              className="self-start flex items-center gap-1 text-xs text-[var(--color-accent-strong)] hover:underline"
            >
              <Plus size={13} /> Agregar ejercicio
            </button>
          </div>

          <button
            type="submit"
            className="self-start bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] transition-colors px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            Guardar entrenamiento
          </button>
        </form>
      </Card>

      {/* Progreso por ejercicio */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-[var(--color-accent-strong)]" />
          <h2 className="text-sm font-medium">Progreso por ejercicio</h2>
        </div>
        <select
          value={progressExercise}
          onChange={(e) => setProgressExercise(e.target.value)}
          className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none mb-3"
        >
          <option value="">Selecciona un ejercicio</option>
          {exerciseNames.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <MiniLineChart data={progressData.map((d) => ({ label: d.date, value: d.weight }))} />
        {progressExercise && <p className="text-xs text-[var(--color-text-muted)] mt-2">Peso (kg) por fecha</p>}
      </Card>

      {/* Historial */}
      <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
        Historial
      </h2>
      <div className="flex flex-col gap-3">
        {sessions.map((s) => (
          <Card key={s.id} className="!p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {s.date} {s.routine_id && routines.find((r) => r.id === s.routine_id) && `· ${routines.find((r) => r.id === s.routine_id).name}`}
              </span>
              <button onClick={() => deleteSession(s.id)} className="text-[var(--color-text-dim)] hover:text-[var(--color-danger)]">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {s.exercises.map((ex) => (
                <div key={ex.id} className="text-xs text-[var(--color-text-muted)] flex gap-3">
                  <span className="text-[var(--color-text)] flex-1">{ex.exercise}</span>
                  <span className="font-mono">{ex.sets ?? '–'}×{ex.reps ?? '–'}</span>
                  <span className="font-mono">{ex.weight ?? '–'} kg</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
        {sessions.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-10">
            Aún no registras entrenamientos.
          </p>
        )}
      </div>
    </div>
  );
}
