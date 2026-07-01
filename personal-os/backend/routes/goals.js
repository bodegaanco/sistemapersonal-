import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/goals
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM goals ORDER BY completed ASC, deadline ASC, id DESC').all();
  res.json(rows);
});

// POST /api/goals  { title, target_amount, current_amount, deadline, icon }
router.post('/', (req, res) => {
  const { title, target_amount, current_amount = 0, deadline, icon = '🎯' } = req.body;
  if (!title || !target_amount) return res.status(400).json({ error: 'title y target_amount son requeridos' });

  const result = db.prepare(
    'INSERT INTO goals (title, target_amount, current_amount, deadline, icon) VALUES (?, ?, ?, ?, ?)'
  ).run(title, Number(target_amount), Number(current_amount) || 0, deadline || null, icon);

  res.status(201).json(db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/goals/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const { title, target_amount, deadline, icon } = req.body;
  db.prepare(
    `UPDATE goals SET
      title = COALESCE(?, title),
      target_amount = COALESCE(?, target_amount),
      deadline = ?,
      icon = COALESCE(?, icon),
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(title, target_amount ? Number(target_amount) : null, deadline !== undefined ? deadline : existing.deadline, icon, id);

  res.json(db.prepare('SELECT * FROM goals WHERE id = ?').get(id));
});

// POST /api/goals/:id/contribute  { amount }  (puede ser negativo para retirar)
router.post('/:id/contribute', (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const existing = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });
  if (amount === undefined) return res.status(400).json({ error: 'amount es requerido' });

  const newAmount = Math.max(0, existing.current_amount + Number(amount));
  const completed = newAmount >= existing.target_amount ? 1 : 0;

  db.prepare(
    `UPDATE goals SET current_amount = ?, completed = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(newAmount, completed, id);

  res.json(db.prepare('SELECT * FROM goals WHERE id = ?').get(id));
});

// DELETE /api/goals/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM goals WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
