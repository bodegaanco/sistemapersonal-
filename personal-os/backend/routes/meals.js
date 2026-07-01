import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/meals -> todas las comidas de la semana
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM meals ORDER BY weekday ASC, id ASC').all();
  res.json(rows);
});

// POST /api/meals  { weekday, meal_type, title, ingredients }
router.post('/', (req, res) => {
  const { weekday, meal_type, title, ingredients } = req.body;
  if (weekday === undefined || !meal_type || !title) {
    return res.status(400).json({ error: 'weekday, meal_type y title son requeridos' });
  }

  const result = db.prepare(
    'INSERT INTO meals (weekday, meal_type, title, ingredients) VALUES (?, ?, ?, ?)'
  ).run(weekday, meal_type, title, ingredients || null);

  res.status(201).json(db.prepare('SELECT * FROM meals WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/meals/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM meals WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const { title, ingredients } = req.body;
  db.prepare(
    `UPDATE meals SET title = COALESCE(?, title), ingredients = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(title, ingredients !== undefined ? ingredients : existing.ingredients, id);

  res.json(db.prepare('SELECT * FROM meals WHERE id = ?').get(id));
});

// DELETE /api/meals/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM meals WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
