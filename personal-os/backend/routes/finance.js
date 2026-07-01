import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

function rangeForPeriod(period, refDateStr) {
  const ref = refDateStr ? new Date(refDateStr) : new Date();
  let from, to;
  if (period === 'day') {
    from = to = ref.toISOString().slice(0, 10);
  } else if (period === 'week') {
    const day = ref.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(ref);
    monday.setDate(monday.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    from = monday.toISOString().slice(0, 10);
    to = sunday.toISOString().slice(0, 10);
  } else if (period === 'year') {
    from = `${ref.getFullYear()}-01-01`;
    to = `${ref.getFullYear()}-12-31`;
  } else {
    // month (default)
    const y = ref.getFullYear();
    const m = ref.getMonth();
    from = new Date(y, m, 1).toISOString().slice(0, 10);
    to = new Date(y, m + 1, 0).toISOString().slice(0, 10);
  }
  return { from, to };
}

function computeBalance(from, to) {
  const row = db.prepare(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END), 0) as ingresos,
      COALESCE(SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END), 0) as gastos
     FROM finance_transactions WHERE date BETWEEN ? AND ?`
  ).get(from, to);
  return { ...row, saldo: row.ingresos - row.gastos };
}

// ---------------------------------------------------------
// CATEGORÍAS
// ---------------------------------------------------------

router.get('/categories', (req, res) => {
  res.json(db.prepare('SELECT * FROM finance_categories ORDER BY type ASC, name ASC').all());
});

router.post('/categories', (req, res) => {
  const { name, type, color = '#6366f1' } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name y type son requeridos' });
  try {
    const result = db.prepare('INSERT INTO finance_categories (name, type, color) VALUES (?, ?, ?)').run(name, type, color);
    res.status(201).json(db.prepare('SELECT * FROM finance_categories WHERE id = ?').get(result.lastInsertRowid));
  } catch {
    res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
  }
});

router.delete('/categories/:id', (req, res) => {
  db.prepare('DELETE FROM finance_categories WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// ---------------------------------------------------------
// TRANSACCIONES
// ---------------------------------------------------------

// GET /api/finance/transactions?from=&to=&type=&category_id=&search=
router.get('/transactions', (req, res) => {
  const { from, to, type, category_id, search } = req.query;
  let sql = 'SELECT * FROM finance_transactions WHERE date BETWEEN ? AND ?';
  const params = [from || '0000-01-01', to || '9999-12-31'];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (category_id) {
    sql += ' AND category_id = ?';
    params.push(category_id);
  }
  if (search) {
    sql += ' AND description LIKE ?';
    params.push(`%${search}%`);
  }
  sql += ' ORDER BY date DESC, id DESC';

  const rows = db.prepare(sql).all(...params);
  const categories = db.prepare('SELECT * FROM finance_categories').all();
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  res.json(rows.map((r) => ({ ...r, category: catMap[r.category_id] || null })));
});

// POST /api/finance/transactions
router.post('/transactions', (req, res) => {
  const { type, amount, category_id, description, date } = req.body;
  if (!type || amount === undefined || !date) {
    return res.status(400).json({ error: 'type, amount y date son requeridos' });
  }
  const result = db.prepare(
    'INSERT INTO finance_transactions (type, amount, category_id, description, date) VALUES (?, ?, ?, ?, ?)'
  ).run(type, Number(amount), category_id || null, description || null, date);

  res.status(201).json(db.prepare('SELECT * FROM finance_transactions WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/finance/transactions/:id
router.put('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM finance_transactions WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const { type, amount, category_id, description, date } = req.body;
  db.prepare(
    `UPDATE finance_transactions SET
      type = COALESCE(?, type),
      amount = COALESCE(?, amount),
      category_id = ?,
      description = ?,
      date = COALESCE(?, date)
     WHERE id = ?`
  ).run(
    type, amount !== undefined ? Number(amount) : existing.amount,
    category_id !== undefined ? category_id : existing.category_id,
    description !== undefined ? description : existing.description,
    date, id
  );

  res.json(db.prepare('SELECT * FROM finance_transactions WHERE id = ?').get(id));
});

// DELETE /api/finance/transactions/:id
router.delete('/transactions/:id', (req, res) => {
  db.prepare('DELETE FROM finance_transactions WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// ---------------------------------------------------------
// RESUMEN / SALDOS
// ---------------------------------------------------------

// GET /api/finance/summary -> saldo de hoy, semana, mes y año en curso
router.get('/summary', (req, res) => {
  const now = new Date();
  const day = rangeForPeriod('day');
  const week = rangeForPeriod('week');
  const month = rangeForPeriod('month');
  const year = rangeForPeriod('year');

  res.json({
    day: computeBalance(day.from, day.to),
    week: computeBalance(week.from, week.to),
    month: computeBalance(month.from, month.to),
    year: computeBalance(year.from, year.to),
  });
});

// GET /api/finance/summary/by-category?from=&to=&type=gasto
router.get('/summary/by-category', (req, res) => {
  const { from, to, type = 'gasto' } = req.query;
  const rows = db.prepare(
    `SELECT c.id, c.name, c.color, COALESCE(SUM(t.amount), 0) as total
     FROM finance_transactions t
     LEFT JOIN finance_categories c ON c.id = t.category_id
     WHERE t.type = ? AND t.date BETWEEN ? AND ?
     GROUP BY c.id
     ORDER BY total DESC`
  ).all(type, from || '0000-01-01', to || '9999-12-31');

  res.json(rows.map((r) => ({ ...r, name: r.name || 'Sin categoría' })));
});

export default router;
