import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

function getTagsForTask(taskId) {
  return db.prepare(
    `SELECT t.* FROM tags t
     JOIN task_tags tt ON tt.tag_id = t.id
     WHERE tt.task_id = ?`
  ).all(taskId);
}

// GET /api/tasks?date=YYYY-MM-DD&status=pending|done&priority=alta
router.get('/', (req, res) => {
  const { date, status, priority } = req.query;
  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];

  if (date) {
    sql += ' AND due_date = ?';
    params.push(date);
  }
  if (status === 'pending') sql += ' AND completed = 0';
  if (status === 'done') sql += ' AND completed = 1';
  if (priority) {
    sql += ' AND priority = ?';
    params.push(priority);
  }
  sql += ' ORDER BY completed ASC, sort_order ASC, due_date ASC';

  const tasks = db.prepare(sql).all(...params);
  const withTags = tasks.map((t) => ({ ...t, tags: getTagsForTask(t.id) }));
  res.json(withTags);
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, notes, priority = 'media', due_date, tag_ids = [] } = req.body;
  if (!title) return res.status(400).json({ error: 'title es requerido' });

  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM tasks').get().m || 0;
  const result = db.prepare(
    'INSERT INTO tasks (title, notes, priority, due_date, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(title, notes || null, priority, due_date || null, maxOrder + 1);

  const taskId = result.lastInsertRowid;
  const insertTag = db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)');
  tag_ids.forEach((tagId) => insertTag.run(taskId, tagId));

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  res.status(201).json({ ...task, tags: getTagsForTask(taskId) });
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const { title, notes, priority, due_date, sort_order, tag_ids } = req.body;
  db.prepare(
    `UPDATE tasks SET
      title = COALESCE(?, title),
      notes = COALESCE(?, notes),
      priority = COALESCE(?, priority),
      due_date = ?,
      sort_order = COALESCE(?, sort_order),
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(title, notes, priority, due_date !== undefined ? due_date : existing.due_date, sort_order, id);

  if (Array.isArray(tag_ids)) {
    db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(id);
    const insertTag = db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)');
    tag_ids.forEach((tagId) => insertTag.run(id, tagId));
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json({ ...task, tags: getTagsForTask(id) });
});

// POST /api/tasks/:id/complete -> alterna completado
router.post('/:id/complete', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const newState = existing.completed ? 0 : 1;
  db.prepare(
    `UPDATE tasks SET completed = ?, completed_at = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(newState, newState ? new Date().toISOString() : null, id);

  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
});

// POST /api/tasks/:id/move -> mover a otra fecha
router.post('/:id/move', (req, res) => {
  const { id } = req.params;
  const { due_date } = req.body;
  db.prepare(`UPDATE tasks SET due_date = ?, updated_at = datetime('now') WHERE id = ?`).run(due_date, id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
