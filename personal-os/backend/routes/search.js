import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/search?q=texto -> resultados combinados de todos los módulos
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json([]);
  const like = `%${q}%`;
  const results = [];

  db.prepare('SELECT id, title FROM tasks WHERE title LIKE ? LIMIT 5').all(like).forEach((t) =>
    results.push({ type: 'Tarea', label: t.title, path: '/tareas' })
  );

  db.prepare('SELECT id, title FROM checklist_items WHERE title LIKE ? LIMIT 5').all(like).forEach((c) =>
    results.push({ type: 'Checklist', label: c.title, path: '/checklist' })
  );

  db.prepare('SELECT id, title FROM habits WHERE title LIKE ? LIMIT 5').all(like).forEach((h) =>
    results.push({ type: 'Hábito', label: h.title, path: '/habitos' })
  );

  db.prepare('SELECT DISTINCT exercise FROM gym_exercise_logs WHERE exercise LIKE ? LIMIT 5').all(like).forEach((e) =>
    results.push({ type: 'Gym', label: e.exercise, path: '/gym' })
  );

  db.prepare('SELECT id, title FROM calendar_events WHERE title LIKE ? LIMIT 5').all(like).forEach((e) =>
    results.push({ type: 'Calendario', label: e.title, path: '/calendario' })
  );

  db.prepare('SELECT id, description FROM finance_transactions WHERE description LIKE ? LIMIT 5').all(like).forEach((f) =>
    results.push({ type: 'Finanzas', label: f.description, path: '/finanzas' })
  );

  db.prepare('SELECT id, title FROM goals WHERE title LIKE ? LIMIT 5').all(like).forEach((g) =>
    results.push({ type: 'Objetivo', label: g.title, path: '/objetivos' })
  );

  db.prepare('SELECT id, name FROM shopping_items WHERE name LIKE ? LIMIT 5').all(like).forEach((s) =>
    results.push({ type: 'Compras', label: s.name, path: '/compras' })
  );

  db.prepare('SELECT id, title FROM meals WHERE title LIKE ? LIMIT 5').all(like).forEach((m) =>
    results.push({ type: 'Comidas', label: m.title, path: '/comidas' })
  );

  res.json(results.slice(0, 20));
});

export default router;
