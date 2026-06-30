import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function calcStreaks(logs) {
  // logs: array de { date, completed } ordenado ascendente
  const completedDates = new Set(logs.filter((l) => l.completed).map((l) => l.date));
  let current = 0;
  let max = 0;
  let running = 0;
  let prevDate = null;

  const sorted = [...completedDates].sort();
  sorted.forEach((dateStr) => {
    if (prevDate) {
      const diffDays = (new Date(dateStr) - new Date(prevDate)) / 86400000;
      running = diffDays === 1 ? running + 1 : 1;
    } else {
      running = 1;
    }
    max = Math.max(max, running);
    prevDate = dateStr;
  });

  // racha actual: contar hacia atrás desde hoy mientras existan días consecutivos completados
  let cursor = new Date();
  current = 0;
  // Si hoy no está completado, empezamos a contar desde ayer (no rompe la racha si aún es de día)
  while (true) {
    const ds = cursor.toISOString().slice(0, 10);
    if (completedDates.has(ds)) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return { current, max };
}

// GET /api/habits -> lista con stats (racha actual, máxima, % últimos 30 días)
router.get('/', (req, res) => {
  const habits = db.prepare('SELECT * FROM habits WHERE active = 1 ORDER BY sort_order ASC').all();

  const result = habits.map((habit) => {
    const logs = db.prepare('SELECT date, completed FROM habit_logs WHERE habit_id = ? ORDER BY date ASC').all(habit.id);
    const { current, max } = calcStreaks(logs);

    const since = new Date();
    since.setDate(since.getDate() - 29);
    const sinceStr = since.toISOString().slice(0, 10);
    const last30 = logs.filter((l) => l.date >= sinceStr);
    const completedCount = last30.filter((l) => l.completed).length;
    const percentage = Math.round((completedCount / 30) * 100);

    const todayLog = logs.find((l) => l.date === todayStr());

    return {
      ...habit,
      completedToday: !!(todayLog && todayLog.completed),
      currentStreak: current,
      maxStreak: max,
      percentage30d: percentage,
    };
  });

  res.json(result);
});

// GET /api/habits/:id/calendar?from=&to= -> log diario para pintar calendario
router.get('/:id/calendar', (req, res) => {
  const { id } = req.params;
  const { from, to } = req.query;
  const logs = db.prepare(
    'SELECT date, completed FROM habit_logs WHERE habit_id = ? AND date BETWEEN ? AND ? ORDER BY date ASC'
  ).all(id, from || '0000-01-01', to || '9999-12-31');
  res.json(logs);
});

// POST /api/habits
router.post('/', (req, res) => {
  const { title, icon = '⭐', color = '#22c55e', frequency = 'daily', target_per_week = 7 } = req.body;
  if (!title) return res.status(400).json({ error: 'title es requerido' });

  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM habits').get().m || 0;
  const result = db.prepare(
    'INSERT INTO habits (title, icon, color, frequency, target_per_week, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title, icon, color, frequency, target_per_week, maxOrder + 1);

  res.status(201).json(db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/habits/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const { title, icon, color, frequency, target_per_week, active, sort_order } = req.body;
  db.prepare(
    `UPDATE habits SET
      title = COALESCE(?, title),
      icon = COALESCE(?, icon),
      color = COALESCE(?, color),
      frequency = COALESCE(?, frequency),
      target_per_week = COALESCE(?, target_per_week),
      active = COALESCE(?, active),
      sort_order = COALESCE(?, sort_order),
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(title, icon, color, frequency, target_per_week, active, sort_order, id);

  res.json(db.prepare('SELECT * FROM habits WHERE id = ?').get(id));
});

// DELETE /api/habits/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM habits WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// POST /api/habits/:id/toggle -> { date } opcional, default hoy
router.post('/:id/toggle', (req, res) => {
  const { id } = req.params;
  const date = req.body.date || todayStr();

  const existing = db.prepare('SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?').get(id, date);
  if (existing) {
    const newState = existing.completed ? 0 : 1;
    db.prepare('UPDATE habit_logs SET completed = ? WHERE id = ?').run(newState, existing.id);
    return res.json({ habit_id: Number(id), date, completed: !!newState });
  }

  db.prepare('INSERT INTO habit_logs (habit_id, date, completed) VALUES (?, ?, 1)').run(id, date);
  res.json({ habit_id: Number(id), date, completed: true });
});

export default router;
