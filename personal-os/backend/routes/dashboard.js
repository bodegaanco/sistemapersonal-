import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const frasesMotivacionales = [
  'Pequeños pasos todos los días construyen grandes resultados.',
  'La disciplina es el puente entre las metas y los logros.',
  'Hoy es una nueva oportunidad para mejorar un 1%.',
  'No cuentes los días, haz que los días cuenten.',
  'El progreso, no la perfección.',
  'Tu futuro se construye con lo que haces hoy.',
  'La constancia vence al talento cuando el talento no es constante.',
];

// GET /api/dashboard -> resumen del día para la pantalla principal
router.get('/', (req, res) => {
  const date = todayStr();

  const checklistItems = db.prepare('SELECT id FROM checklist_items WHERE active = 1').all();
  const checklistDone = db.prepare(
    'SELECT COUNT(*) as c FROM checklist_logs WHERE date = ? AND completed = 1'
  ).get(date).c;

  const tasksToday = db.prepare(
    'SELECT COUNT(*) as total, SUM(completed) as done FROM tasks WHERE due_date = ?'
  ).get(date);

  const habits = db.prepare('SELECT id FROM habits WHERE active = 1').all();
  const habitsDone = db.prepare(
    'SELECT COUNT(*) as c FROM habit_logs WHERE date = ? AND completed = 1'
  ).get(date).c;

  const totalItems = checklistItems.length + habits.length + (tasksToday.total || 0);
  const totalDone = checklistDone + habitsDone + (tasksToday.done || 0);
  const progress = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  const phrase = frasesMotivacionales[Math.floor(Math.random() * frasesMotivacionales.length)];

  const userName = db.prepare("SELECT value FROM settings WHERE key = 'user_name'").get()?.value || 'Francisco';

  res.json({
    date,
    userName,
    phrase,
    progress,
    checklist: { total: checklistItems.length, done: checklistDone },
    tasks: { total: tasksToday.total || 0, done: tasksToday.done || 0 },
    habits: { total: habits.length, done: habitsDone },
  });
});

export default router;
