import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/schedule -> todos los bloques, ordenados por día y hora
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM schedule_blocks ORDER BY weekday ASC, start_time ASC').all();
  res.json(rows);
});

// POST /api/schedule  { weekday, start_time, end_time, title, color }
router.post('/', (req, res) => {
  const { weekday, start_time, end_time, title, color = '#6366f1' } = req.body;
  if (weekday === undefined || !start_time || !title) {
    return res.status(400).json({ error: 'weekday, start_time y title son requeridos' });
  }

  const result = db.prepare(
    'INSERT INTO schedule_blocks (weekday, start_time, end_time, title, color) VALUES (?, ?, ?, ?, ?)'
  ).run(weekday, start_time, end_time || null, title, color);

  res.status(201).json(db.prepare('SELECT * FROM schedule_blocks WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/schedule/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM schedule_blocks WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const { weekday, start_time, end_time, title, color } = req.body;
  db.prepare(
    `UPDATE schedule_blocks SET
      weekday = COALESCE(?, weekday),
      start_time = COALESCE(?, start_time),
      end_time = ?,
      title = COALESCE(?, title),
      color = COALESCE(?, color)
     WHERE id = ?`
  ).run(weekday, start_time, end_time !== undefined ? end_time : existing.end_time, title, color, id);

  res.json(db.prepare('SELECT * FROM schedule_blocks WHERE id = ?').get(id));
});

// DELETE /api/schedule/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM schedule_blocks WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
