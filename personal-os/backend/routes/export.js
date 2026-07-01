import { Router } from 'express';
import ExcelJS from 'exceljs';
import db from '../db/database.js';

const router = Router();
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function styleHeader(row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
    cell.alignment = { vertical: 'middle' };
  });
}

// GET /api/export/excel -> descarga un .xlsx con todas las hojas
router.get('/excel', async (req, res) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Personal OS';
  wb.created = new Date();

  // --- Hoja 1: Ingresos ---
  const ingresosSheet = wb.addWorksheet('Ingresos');
  ingresosSheet.columns = [
    { header: 'Fecha', key: 'date', width: 14 },
    { header: 'Descripción', key: 'description', width: 30 },
    { header: 'Categoría', key: 'category', width: 20 },
    { header: 'Monto', key: 'amount', width: 16 },
  ];
  const ingresos = db.prepare(
    `SELECT t.date, t.description, c.name as category, t.amount
     FROM finance_transactions t LEFT JOIN finance_categories c ON c.id = t.category_id
     WHERE t.type = 'ingreso' ORDER BY t.date ASC`
  ).all();
  ingresos.forEach((r) => ingresosSheet.addRow(r));
  styleHeader(ingresosSheet.getRow(1));
  ingresosSheet.getColumn('amount').numFmt = '#,##0';

  // --- Hoja 2: Gastos ---
  const gastosSheet = wb.addWorksheet('Gastos');
  gastosSheet.columns = [
    { header: 'Fecha', key: 'date', width: 14 },
    { header: 'Descripción', key: 'description', width: 30 },
    { header: 'Categoría', key: 'category', width: 20 },
    { header: 'Monto', key: 'amount', width: 16 },
  ];
  const gastos = db.prepare(
    `SELECT t.date, t.description, c.name as category, t.amount
     FROM finance_transactions t LEFT JOIN finance_categories c ON c.id = t.category_id
     WHERE t.type = 'gasto' ORDER BY t.date ASC`
  ).all();
  gastos.forEach((r) => gastosSheet.addRow(r));
  styleHeader(gastosSheet.getRow(1));
  gastosSheet.getColumn('amount').numFmt = '#,##0';

  // --- Hoja 3: Resumen financiero (con fórmulas) ---
  const resumenSheet = wb.addWorksheet('Resumen financiero');
  resumenSheet.columns = [{ header: 'Concepto', key: 'concepto', width: 28 }, { header: 'Monto', key: 'monto', width: 18 }];
  styleHeader(resumenSheet.getRow(1));
  const lastIngresoRow = ingresos.length + 1;
  const lastGastoRow = gastos.length + 1;
  resumenSheet.addRow({ concepto: 'Total ingresos', monto: { formula: `SUM(Ingresos!D2:D${lastIngresoRow})` } });
  resumenSheet.addRow({ concepto: 'Total gastos', monto: { formula: `SUM(Gastos!D2:D${lastGastoRow})` } });
  resumenSheet.addRow({ concepto: 'Saldo', monto: { formula: 'B2-B3' } });
  resumenSheet.getColumn('monto').numFmt = '#,##0';

  // --- Hoja 4: Objetivos de ahorro (con % de avance) ---
  const goalsSheet = wb.addWorksheet('Objetivos de ahorro');
  goalsSheet.columns = [
    { header: 'Objetivo', key: 'title', width: 26 },
    { header: 'Monto actual', key: 'current_amount', width: 16 },
    { header: 'Monto objetivo', key: 'target_amount', width: 16 },
    { header: '% Avance', key: 'pct', width: 12 },
    { header: 'Fecha límite', key: 'deadline', width: 14 },
  ];
  styleHeader(goalsSheet.getRow(1));
  const goals = db.prepare('SELECT * FROM goals ORDER BY id ASC').all();
  goals.forEach((g, i) => {
    const rowNum = i + 2;
    goalsSheet.addRow({
      title: g.title, current_amount: g.current_amount, target_amount: g.target_amount,
      pct: { formula: `B${rowNum}/C${rowNum}` }, deadline: g.deadline || '',
    });
  });
  goalsSheet.getColumn('current_amount').numFmt = '#,##0';
  goalsSheet.getColumn('target_amount').numFmt = '#,##0';
  goalsSheet.getColumn('pct').numFmt = '0%';

  // --- Hoja 5: Registro de entrenamientos ---
  const gymSheet = wb.addWorksheet('Entrenamientos');
  gymSheet.columns = [
    { header: 'Fecha', key: 'date', width: 14 },
    { header: 'Ejercicio', key: 'exercise', width: 24 },
    { header: 'Series', key: 'sets', width: 10 },
    { header: 'Reps', key: 'reps', width: 10 },
    { header: 'Peso (kg)', key: 'weight', width: 12 },
    { header: 'Notas', key: 'notes', width: 24 },
  ];
  styleHeader(gymSheet.getRow(1));
  const gymRows = db.prepare(
    `SELECT s.date, e.exercise, e.sets, e.reps, e.weight, e.notes
     FROM gym_exercise_logs e JOIN gym_sessions s ON s.id = e.session_id
     ORDER BY s.date ASC`
  ).all();
  gymRows.forEach((r) => gymSheet.addRow(r));

  // --- Hoja 6: Hábitos ---
  const habitsSheet = wb.addWorksheet('Hábitos');
  habitsSheet.columns = [
    { header: 'Hábito', key: 'title', width: 22 },
    { header: 'Racha actual', key: 'streak', width: 14 },
    { header: 'Racha máxima', key: 'maxStreak', width: 14 },
    { header: '% últimos 30 días', key: 'pct', width: 18 },
  ];
  styleHeader(habitsSheet.getRow(1));
  const habits = db.prepare('SELECT * FROM habits ORDER BY sort_order ASC').all();
  habits.forEach((h) => {
    const logs = db.prepare('SELECT date, completed FROM habit_logs WHERE habit_id = ?').all(h.id);
    const completedDates = new Set(logs.filter((l) => l.completed).map((l) => l.date));
    let streak = 0;
    let cursor = new Date();
    while (completedDates.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    const sortedDates = [...completedDates].sort();
    let max = 0, running = 0, prev = null;
    sortedDates.forEach((d) => {
      running = prev && (new Date(d) - new Date(prev)) / 86400000 === 1 ? running + 1 : 1;
      max = Math.max(max, running);
      prev = d;
    });
    const since = new Date();
    since.setDate(since.getDate() - 29);
    const sinceStr = since.toISOString().slice(0, 10);
    const last30 = logs.filter((l) => l.date >= sinceStr && l.completed).length;
    habitsSheet.addRow({ title: h.title, streak, maxStreak: max, pct: Math.round((last30 / 30) * 100) / 100 });
  });
  habitsSheet.getColumn('pct').numFmt = '0%';

  // --- Hoja 7: Calendario semanal (horario fijo) ---
  const scheduleSheet = wb.addWorksheet('Calendario semanal');
  scheduleSheet.columns = [
    { header: 'Día', key: 'dia', width: 14 },
    { header: 'Hora inicio', key: 'start_time', width: 12 },
    { header: 'Hora fin', key: 'end_time', width: 12 },
    { header: 'Actividad', key: 'title', width: 24 },
  ];
  styleHeader(scheduleSheet.getRow(1));
  const blocks = db.prepare('SELECT * FROM schedule_blocks ORDER BY weekday ASC, start_time ASC').all();
  blocks.forEach((b) => scheduleSheet.addRow({
    dia: DIAS[b.weekday], start_time: b.start_time, end_time: b.end_time || '', title: b.title,
  }));

  // --- Hoja 8: Compras ---
  const shoppingSheet = wb.addWorksheet('Compras');
  shoppingSheet.columns = [
    { header: 'Ítem', key: 'name', width: 24 },
    { header: 'Cantidad', key: 'quantity', width: 14 },
    { header: 'Categoría', key: 'category', width: 20 },
    { header: 'Comprado', key: 'checked', width: 12 },
  ];
  styleHeader(shoppingSheet.getRow(1));
  const shoppingRows = db.prepare('SELECT * FROM shopping_items ORDER BY category ASC, name ASC').all();
  shoppingRows.forEach((s) => shoppingSheet.addRow({
    name: s.name, quantity: s.quantity || '', category: s.category, checked: s.checked ? 'Sí' : 'No',
  }));

  // --- Hoja 9: Comidas semanales ---
  const mealsSheet = wb.addWorksheet('Comidas semanales');
  mealsSheet.columns = [
    { header: 'Día', key: 'dia', width: 14 },
    { header: 'Comida', key: 'meal_type', width: 14 },
    { header: 'Plato', key: 'title', width: 26 },
    { header: 'Ingredientes', key: 'ingredients', width: 34 },
  ];
  styleHeader(mealsSheet.getRow(1));
  const mealRows = db.prepare('SELECT * FROM meals ORDER BY weekday ASC').all();
  const MEAL_LABELS = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', cena: 'Cena', snack: 'Snack' };
  mealRows.forEach((m) => mealsSheet.addRow({
    dia: DIAS[m.weekday], meal_type: MEAL_LABELS[m.meal_type] || m.meal_type,
    title: m.title, ingredients: (m.ingredients || '').replace(/\n/g, ', '),
  }));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="personal-os-${new Date().toISOString().slice(0, 10)}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
});

export default router;
