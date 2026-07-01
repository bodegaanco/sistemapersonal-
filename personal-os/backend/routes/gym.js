import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// ---------------------------------------------------------
// RUTINAS POR DÍA (ej: Lunes -> Pecho)
// ---------------------------------------------------------

// GET /api/gym/routines -> agrupadas por día de la semana (0=Lunes..6=Domingo)
router.get('/routines', (req, res) => {
  const rows = db.prepare('SELECT * FROM gym_routines ORDER BY weekday ASC, id ASC').all();
  res.json(rows);
});

// POST /api/gym/routines  { weekday, name }
router.post('/routines', (req, res) => {
  const { weekday, name } = req.body;
  if (weekday === undefined || !name) return res.status(400).json({ error: 'weekday y name son requeridos' });

  const result = db.prepare('INSERT INTO gym_routines (weekday, name) VALUES (?, ?)').run(weekday, name);
  res.status(201).json(db.prepare('SELECT * FROM gym_routines WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/gym/routines/:id
router.put('/routines/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM gym_routines WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const { weekday, name } = req.body;
  db.prepare('UPDATE gym_routines SET weekday = COALESCE(?, weekday), name = COALESCE(?, name) WHERE id = ?')
    .run(weekday, name, id);
  res.json(db.prepare('SELECT * FROM gym_routines WHERE id = ?').get(id));
});

// DELETE /api/gym/routines/:id
router.delete('/routines/:id', (req, res) => {
  db.prepare('DELETE FROM gym_routines WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// ---------------------------------------------------------
// SESIONES DE ENTRENAMIENTO (con ejercicios registrados)
// ---------------------------------------------------------

function getExercisesForSession(sessionId) {
  return db.prepare(
    'SELECT * FROM gym_exercise_logs WHERE session_id = ? ORDER BY sort_order ASC, id ASC'
  ).all(sessionId);
}

// GET /api/gym/sessions?from=&to=&routine_id=
router.get('/sessions', (req, res) => {
  const { from, to, routine_id } = req.query;
  let sql = 'SELECT * FROM gym_sessions WHERE date BETWEEN ? AND ?';
  const params = [from || '0000-01-01', to || '9999-12-31'];
  if (routine_id) {
    sql += ' AND routine_id = ?';
    params.push(routine_id);
  }
  sql += ' ORDER BY date DESC, id DESC';

  const sessions = db.prepare(sql).all(...params);
  const withExercises = sessions.map((s) => ({ ...s, exercises: getExercisesForSession(s.id) }));
  res.json(withExercises);
});

// POST /api/gym/sessions  { date, routine_id, notes, exercises: [{exercise, sets, reps, weight, notes}] }
router.post('/sessions', (req, res) => {
  const { date, routine_id, notes, exercises = [] } = req.body;
  if (!date) return res.status(400).json({ error: 'date es requerida' });

  const result = db.prepare(
    'INSERT INTO gym_sessions (routine_id, date, notes) VALUES (?, ?, ?)'
  ).run(routine_id || null, date, notes || null);

  const sessionId = result.lastInsertRowid;
  const insertEx = db.prepare(
    'INSERT INTO gym_exercise_logs (session_id, exercise, sets, reps, weight, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  exercises.forEach((ex, i) => {
    insertEx.run(sessionId, ex.exercise, ex.sets ?? null, ex.reps ?? null, ex.weight ?? null, ex.notes || null, i);
  });

  const session = db.prepare('SELECT * FROM gym_sessions WHERE id = ?').get(sessionId);
  res.status(201).json({ ...session, exercises: getExercisesForSession(sessionId) });
});

// PUT /api/gym/sessions/:id -> reemplaza notas/fecha y la lista completa de ejercicios
router.put('/sessions/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM gym_sessions WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const { date, routine_id, notes, exercises } = req.body;
  db.prepare('UPDATE gym_sessions SET date = COALESCE(?, date), routine_id = ?, notes = ? WHERE id = ?')
    .run(date, routine_id ?? existing.routine_id, notes ?? existing.notes, id);

  if (Array.isArray(exercises)) {
    db.prepare('DELETE FROM gym_exercise_logs WHERE session_id = ?').run(id);
    const insertEx = db.prepare(
      'INSERT INTO gym_exercise_logs (session_id, exercise, sets, reps, weight, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    exercises.forEach((ex, i) => {
      insertEx.run(id, ex.exercise, ex.sets ?? null, ex.reps ?? null, ex.weight ?? null, ex.notes || null, i);
    });
  }

  const session = db.prepare('SELECT * FROM gym_sessions WHERE id = ?').get(id);
  res.json({ ...session, exercises: getExercisesForSession(id) });
});

// DELETE /api/gym/sessions/:id
router.delete('/sessions/:id', (req, res) => {
  db.prepare('DELETE FROM gym_sessions WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// ---------------------------------------------------------
// PROGRESO POR EJERCICIO (para graficar peso/volumen en el tiempo)
// ---------------------------------------------------------

// GET /api/gym/progress?exercise=Press%20banca
router.get('/progress', (req, res) => {
  const { exercise } = req.query;
  if (!exercise) return res.status(400).json({ error: 'exercise es requerido' });

  const rows = db.prepare(
    `SELECT s.date, e.sets, e.reps, e.weight
     FROM gym_exercise_logs e
     JOIN gym_sessions s ON s.id = e.session_id
     WHERE e.exercise = ?
     ORDER BY s.date ASC`
  ).all(exercise);

  res.json(rows);
});

// GET /api/gym/exercises -> lista de nombres de ejercicios ya usados (autocompletar)
router.get('/exercises', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT exercise FROM gym_exercise_logs ORDER BY exercise ASC').all();
  res.json(rows.map((r) => r.exercise));
});

export default router;
