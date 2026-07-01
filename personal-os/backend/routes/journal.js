import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/journal?from=&to=
router.get('/', (req, res) => {
  const { from, to } = req.query;
  const rows = db.prepare(
    'SELECT * FROM journal_entries WHERE date BETWEEN ? AND ? ORDER BY date DESC'
  ).all(from || '0000-01-01', to || '9999-12-31');
  res.json(rows);
});

// GET /api/journal/:date -> una entrada puntual (o null)
router.get('/:date', (req, res) => {
  const row = db.prepare('SELECT * FROM journal_entries WHERE date = ?').get(req.params.date);
  res.json(row || null);
});

// PUT /api/journal/:date -> crea o actualiza la entrada de ese día (upsert)
router.put('/:date', (req, res) => {
  const { date } = req.params;
  const { how_was_day, what_went_well, what_to_improve, mood, energy, productivity } = req.body;

  db.prepare(
    `INSERT INTO journal_entries (date, how_was_day, what_went_well, what_to_improve, mood, energy, productivity)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       how_was_day = excluded.how_was_day,
       what_went_well = excluded.what_went_well,
       what_to_improve = excluded.what_to_improve,
       mood = excluded.mood,
       energy = excluded.energy,
       productivity = excluded.productivity,
       updated_at = datetime('now')`
  ).run(
    date,
    how_was_day || null, what_went_well || null, what_to_improve || null,
    mood ?? null, energy ?? null, productivity ?? null
  );

  res.json(db.prepare('SELECT * FROM journal_entries WHERE date = ?').get(date));
});

// DELETE /api/journal/:date
router.delete('/:date', (req, res) => {
  db.prepare('DELETE FROM journal_entries WHERE date = ?').run(req.params.date);
  res.status(204).end();
});

export default router;
