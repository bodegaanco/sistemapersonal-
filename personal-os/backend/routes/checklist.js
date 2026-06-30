import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/checklist?date=YYYY-MM-DD  -> items + estado de cumplimiento de esa fecha
router.get('/', (req, res) => {
  const date = req.query.date || todayStr();
  const items = db.prepare(
    'SELECT * FROM checklist_items WHERE active = 1 ORDER BY sort_order ASC'
  ).all();

  const logs = db.prepare(
    'SELECT item_id, completed FROM checklist_logs WHERE date = ?'
  ).all(date);
  const logMap = Object.fromEntries(logs.map((l) => [l.item_id, l.completed]));

  const result = items.map((item) => ({
    ...item,
    completed: !!logMap[item.id],
  }));

  res.json({ date, items: result });
});

// POST /api/checklist -> crear nuevo ítem fijo
router.post('/', (req, res) => {
  const { title, icon = '✓' } = req.body;
  if (!title) return res.status(400).json({ error: 'title es requerido' });

  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM checklist_items').get().m || 0;
  const result = db.prepare(
    'INSERT INTO checklist_items (title, icon, sort_order) VALUES (?, ?, ?)'
  ).run(title, icon, maxOrder + 1);

  const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

// PUT /api/checklist/:id -> editar ítem (título, ícono, orden, activo)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const { title, icon, sort_order, active } = req.body;
  db.prepare(
    `UPDATE checklist_items SET
      title = COALESCE(?, title),
      icon = COALESCE(?, icon),
      sort_order = COALESCE(?, sort_order),
      active = COALESCE(?, active),
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(title, icon, sort_order, active, id);

  res.json(db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(id));
});

// DELETE /api/checklist/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM checklist_items WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// POST /api/checklist/reorder -> [{id, sort_order}, ...]
router.post('/reorder', (req, res) => {
  const { order } = req.body; // array de ids en el nuevo orden
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order debe ser un arreglo' });

  const update = db.prepare('UPDATE checklist_items SET sort_order = ? WHERE id = ?');
  const tx = db.transaction((ids) => {
    ids.forEach((id, idx) => update.run(idx, id));
  });
  tx(order);

  res.json({ ok: true });
});

// POST /api/checklist/:id/toggle -> marca/desmarca completado para una fecha
router.post('/:id/toggle', (req, res) => {
  const { id } = req.params;
  const date = req.body.date || todayStr();

  const existing = db.prepare(
    'SELECT * FROM checklist_logs WHERE item_id = ? AND date = ?'
  ).get(id, date);

  if (existing) {
    const newState = existing.completed ? 0 : 1;
    db.prepare(
      `UPDATE checklist_logs SET completed = ?, completed_at = ? WHERE id = ?`
    ).run(newState, newState ? new Date().toISOString() : null, existing.id);
    return res.json({ item_id: Number(id), date, completed: !!newState });
  }

  db.prepare(
    'INSERT INTO checklist_logs (item_id, date, completed, completed_at) VALUES (?, ?, 1, ?)'
  ).run(id, date, new Date().toISOString());

  res.json({ item_id: Number(id), date, completed: true });
});

// GET /api/checklist/history?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/history', (req, res) => {
  const { from, to } = req.query;
  const rows = db.prepare(
    `SELECT date, COUNT(*) as total, SUM(completed) as done
     FROM checklist_logs
     WHERE date BETWEEN ? AND ?
     GROUP BY date ORDER BY date ASC`
  ).all(from || '0000-01-01', to || '9999-12-31');
  res.json(rows);
});

export default router;
