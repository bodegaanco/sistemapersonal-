import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/shopping -> todos los ítems, ordenados por categoría
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM shopping_items ORDER BY checked ASC, category ASC, id ASC').all();
  res.json(rows);
});

// POST /api/shopping  { name, quantity, category }
router.post('/', (req, res) => {
  const { name, quantity, category = 'Otros' } = req.body;
  if (!name) return res.status(400).json({ error: 'name es requerido' });

  const result = db.prepare(
    'INSERT INTO shopping_items (name, quantity, category) VALUES (?, ?, ?)'
  ).run(name.trim(), quantity || null, category);

  res.status(201).json(db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(result.lastInsertRowid));
});

// POST /api/shopping/bulk  { items: [{name, quantity, category}], defaultCategory }
// Agrega varios ítems a la vez (usado al mandar ingredientes de una comida)
router.post('/bulk', (req, res) => {
  const { items = [], defaultCategory = 'Otros' } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items debe ser un arreglo no vacío' });
  }

  const insert = db.prepare('INSERT INTO shopping_items (name, quantity, category) VALUES (?, ?, ?)');
  const tx = db.transaction((list) => {
    list.forEach((item) => {
      const name = typeof item === 'string' ? item : item.name;
      const quantity = typeof item === 'string' ? null : item.quantity || null;
      const category = typeof item === 'string' ? defaultCategory : item.category || defaultCategory;
      if (name && name.trim()) insert.run(name.trim(), quantity, category);
    });
  });
  tx(items);

  res.status(201).json(db.prepare('SELECT * FROM shopping_items ORDER BY checked ASC, category ASC, id ASC').all());
});

// PUT /api/shopping/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const { name, quantity, category } = req.body;
  db.prepare(
    `UPDATE shopping_items SET
      name = COALESCE(?, name),
      quantity = ?,
      category = COALESCE(?, category)
     WHERE id = ?`
  ).run(name, quantity !== undefined ? quantity : existing.quantity, category, id);

  res.json(db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(id));
});

// POST /api/shopping/:id/toggle
router.post('/:id/toggle', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const newState = existing.checked ? 0 : 1;
  db.prepare('UPDATE shopping_items SET checked = ? WHERE id = ?').run(newState, id);
  res.json(db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(id));
});

// DELETE /api/shopping/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM shopping_items WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// DELETE /api/shopping/checked/all -> limpia todos los ítems ya comprados
router.delete('/checked/all', (req, res) => {
  db.prepare('DELETE FROM shopping_items WHERE checked = 1').run();
  res.status(204).end();
});

export default router;
