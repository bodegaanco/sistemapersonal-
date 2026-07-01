import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

// Genera las ocurrencias de un evento (con o sin repetición) dentro de un
// rango [rangeFrom, rangeTo] (fechas YYYY-MM-DD).
function expandOccurrences(event, rangeFrom, rangeTo) {
  const occurrences = [];
  const originalStart = new Date(event.start_date);
  const rangeFromDate = new Date(rangeFrom);
  const rangeToDate = new Date(rangeTo);

  // Duración del evento (para desplazar end_date junto con start_date)
  const durationMs = event.end_date ? new Date(event.end_date) - originalStart : 0;

  if (!event.repeat_rule || event.repeat_rule === 'none') {
    if (originalStart >= rangeFromDate && originalStart <= rangeToDate) {
      occurrences.push(buildOccurrence(event, originalStart, durationMs));
    }
    return occurrences;
  }

  let cursor = new Date(originalStart);
  let safety = 0;
  while (cursor <= rangeToDate && safety < 1000) {
    if (cursor >= rangeFromDate) {
      occurrences.push(buildOccurrence(event, cursor, durationMs));
    }
    if (event.repeat_rule === 'daily') cursor = addDays(cursor, 1);
    else if (event.repeat_rule === 'weekly') cursor = addDays(cursor, 7);
    else if (event.repeat_rule === 'monthly') cursor = addMonths(cursor, 1);
    else break;
    safety += 1;
  }
  return occurrences;
}

function buildOccurrence(event, startDate, durationMs) {
  const start = new Date(startDate);
  const end = durationMs ? new Date(start.getTime() + durationMs) : null;
  return {
    ...event,
    occurrence_start: start.toISOString(),
    occurrence_end: end ? end.toISOString() : null,
  };
}

// GET /api/calendar/events?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/events', (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from y to son requeridos' });

  // Traemos eventos que puedan tener alguna ocurrencia en el rango:
  // no repetidos que empiecen antes de "to", o repetidos que empezaron
  // antes de "to" (su repetición puede seguir generando ocurrencias).
  const events = db.prepare(
    `SELECT * FROM calendar_events WHERE start_date <= ? ORDER BY start_date ASC`
  ).all(`${to}T23:59:59`);

  const all = events.flatMap((ev) => expandOccurrences(ev, from, to));
  all.sort((a, b) => new Date(a.occurrence_start) - new Date(b.occurrence_start));
  res.json(all);
});

// POST /api/calendar/events
router.post('/events', (req, res) => {
  const {
    title, description, start_date, end_date, all_day = 0,
    repeat_rule = 'none', reminder_minutes_before, color = '#6366f1',
  } = req.body;
  if (!title || !start_date) return res.status(400).json({ error: 'title y start_date son requeridos' });

  const result = db.prepare(
    `INSERT INTO calendar_events (title, description, start_date, end_date, all_day, repeat_rule, reminder_minutes_before, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(title, description || null, start_date, end_date || null, all_day ? 1 : 0, repeat_rule, reminder_minutes_before ?? null, color);

  res.status(201).json(db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/calendar/events/:id
router.put('/events/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const {
    title, description, start_date, end_date, all_day,
    repeat_rule, reminder_minutes_before, color,
  } = req.body;

  db.prepare(
    `UPDATE calendar_events SET
      title = COALESCE(?, title),
      description = ?,
      start_date = COALESCE(?, start_date),
      end_date = ?,
      all_day = COALESCE(?, all_day),
      repeat_rule = COALESCE(?, repeat_rule),
      reminder_minutes_before = ?,
      color = COALESCE(?, color),
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    title,
    description !== undefined ? description : existing.description,
    start_date, end_date !== undefined ? end_date : existing.end_date,
    all_day, repeat_rule,
    reminder_minutes_before !== undefined ? reminder_minutes_before : existing.reminder_minutes_before,
    color, id
  );

  res.json(db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(id));
});

// POST /api/calendar/events/:id/move -> mover a otra fecha/hora de inicio
router.post('/events/:id/move', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const { start_date } = req.body;
  if (!start_date) return res.status(400).json({ error: 'start_date es requerido' });

  let newEnd = existing.end_date;
  if (existing.end_date) {
    const duration = new Date(existing.end_date) - new Date(existing.start_date);
    newEnd = new Date(new Date(start_date).getTime() + duration).toISOString();
  }

  db.prepare(`UPDATE calendar_events SET start_date = ?, end_date = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(start_date, newEnd, id);

  res.json(db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(id));
});

// DELETE /api/calendar/events/:id
router.delete('/events/:id', (req, res) => {
  db.prepare('DELETE FROM calendar_events WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
