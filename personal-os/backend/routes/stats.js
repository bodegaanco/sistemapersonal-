import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// GET /api/stats/overview -> resumen para el dashboard de estadísticas
router.get('/overview', (req, res) => {
  const since14 = daysAgoISO(13);
  const since30 = daysAgoISO(29);
  const today = new Date().toISOString().slice(0, 10);

  // Serie de 14 días: % de checklist y % de hábitos cumplidos por día
  const checklistTotal = db.prepare('SELECT COUNT(*) as c FROM checklist_items WHERE active = 1').get().c || 1;
  const habitsTotal = db.prepare('SELECT COUNT(*) as c FROM habits WHERE active = 1').get().c || 1;

  const checklistByDate = db.prepare(
    `SELECT date, SUM(completed) as done FROM checklist_logs WHERE date BETWEEN ? AND ? GROUP BY date`
  ).all(since14, today);
  const habitsByDate = db.prepare(
    `SELECT date, SUM(completed) as done FROM habit_logs WHERE date BETWEEN ? AND ? GROUP BY date`
  ).all(since14, today);

  const checklistMap = Object.fromEntries(checklistByDate.map((r) => [r.date, r.done]));
  const habitsMap = Object.fromEntries(habitsByDate.map((r) => [r.date, r.done]));

  const series = [];
  for (let i = 13; i >= 0; i--) {
    const date = daysAgoISO(i);
    series.push({
      date,
      checklistPct: Math.round(((checklistMap[date] || 0) / checklistTotal) * 100),
      habitsPct: Math.round(((habitsMap[date] || 0) / habitsTotal) * 100),
    });
  }

  const tasksLast30 = db.prepare(
    `SELECT COUNT(*) as total, SUM(completed) as done FROM tasks WHERE created_at >= ?`
  ).get(`${since30} 00:00:00`);

  const gymSessionsLast30 = db.prepare(
    `SELECT COUNT(*) as c FROM gym_sessions WHERE date BETWEEN ? AND ?`
  ).get(since30, today).c;

  const futbolLast30 = db.prepare(
    `SELECT COUNT(*) as sesiones, COALESCE(SUM(goals),0) as goles, COALESCE(SUM(assists),0) as asistencias
     FROM futbol_logs WHERE date BETWEEN ? AND ?`
  ).get(since30, today);

  const now = new Date();
  const monthFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const financeMonth = db.prepare(
    `SELECT
      COALESCE(SUM(CASE WHEN type='ingreso' THEN amount ELSE 0 END),0) as ingresos,
      COALESCE(SUM(CASE WHEN type='gasto' THEN amount ELSE 0 END),0) as gastos
     FROM finance_transactions WHERE date BETWEEN ? AND ?`
  ).get(monthFrom, monthTo);

  const goals = db.prepare('SELECT COUNT(*) as total, SUM(completed) as completadas FROM goals').get();

  const habitStreaks = db.prepare('SELECT id FROM habits WHERE active = 1').all().map((h) => {
    const logs = db.prepare('SELECT date, completed FROM habit_logs WHERE habit_id = ? AND completed = 1 ORDER BY date DESC').all(h.id);
    let streak = 0;
    let cursor = new Date();
    const set = new Set(logs.map((l) => l.date));
    while (set.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  });
  const bestCurrentStreak = habitStreaks.length ? Math.max(...habitStreaks) : 0;

  res.json({
    series,
    tasks: { total: tasksLast30.total || 0, done: tasksLast30.done || 0 },
    gymSessionsLast30,
    futbolLast30,
    financeMonth: { ...financeMonth, saldo: financeMonth.ingresos - financeMonth.gastos },
    goals: { total: goals.total || 0, completadas: goals.completadas || 0 },
    bestCurrentStreak,
  });
});

export default router;
