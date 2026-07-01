import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/futbol?from=&to=&type=partido|entrenamiento
router.get('/', (req, res) => {
  const { from, to, type } = req.query;
  let sql = 'SELECT * FROM futbol_logs WHERE date BETWEEN ? AND ?';
  const params = [from || '0000-01-01', to || '9999-12-31'];
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  sql += ' ORDER BY date DESC, id DESC';

  res.json(db.prepare(sql).all(...params));
});

// POST /api/futbol
router.post('/', (req, res) => {
  const {
    date, type = 'partido', position, minutes, goals = 0,
    assists = 0, physical_state, feeling, notes,
  } = req.body;
  if (!date) return res.status(400).json({ error: 'date es requerida' });

  const result = db.prepare(
    `INSERT INTO futbol_logs (date, type, position, minutes, goals, assists, physical_state, feeling, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(date, type, position || null, minutes ?? null, goals, assists, physical_state || null, feeling || null, notes || null);

  res.status(201).json(db.prepare('SELECT * FROM futbol_logs WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/futbol/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM futbol_logs WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const {
    date, type, position, minutes, goals, assists, physical_state, feeling, notes,
  } = req.body;

  db.prepare(
    `UPDATE futbol_logs SET
      date = COALESCE(?, date),
      type = COALESCE(?, type),
      position = ?,
      minutes = ?,
      goals = COALESCE(?, goals),
      assists = COALESCE(?, assists),
      physical_state = ?,
      feeling = ?,
      notes = ?
     WHERE id = ?`
  ).run(
    date, type,
    position !== undefined ? position : existing.position,
    minutes !== undefined ? minutes : existing.minutes,
    goals, assists,
    physical_state !== undefined ? physical_state : existing.physical_state,
    feeling !== undefined ? feeling : existing.feeling,
    notes !== undefined ? notes : existing.notes,
    id
  );

  res.json(db.prepare('SELECT * FROM futbol_logs WHERE id = ?').get(id));
});

// DELETE /api/futbol/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM futbol_logs WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// GET /api/futbol/stats?from=&to= -> totales acumulados
router.get('/stats/summary', (req, res) => {
  const { from, to } = req.query;
  const row = db.prepare(
    `SELECT
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN type = 'partido' THEN 1 ELSE 0 END), 0) as partidos,
      COALESCE(SUM(CASE WHEN type = 'entrenamiento' THEN 1 ELSE 0 END), 0) as entrenamientos,
      COALESCE(SUM(goals), 0) as goles,
      COALESCE(SUM(assists), 0) as asistencias,
      COALESCE(SUM(minutes), 0) as minutos
     FROM futbol_logs
     WHERE date BETWEEN ? AND ?`
  ).get(from || '0000-01-01', to || '9999-12-31');

  res.json(row);
});

export default router;
