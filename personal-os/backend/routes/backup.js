import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Tablas incluidas en el respaldo (se excluye 'settings' porque contiene
// el hash de la contraseña; el nombre de usuario se respalda aparte).
const TABLES = [
  'checklist_items', 'checklist_logs',
  'tags', 'tasks', 'task_tags',
  'habits', 'habit_logs',
  'gym_routines', 'gym_sessions', 'gym_exercise_logs',
  'futbol_logs',
  'calendar_events', 'schedule_blocks',
  'finance_categories', 'finance_transactions',
  'goals',
  'journal_entries',
  'shopping_items',
  'meals',
];

// GET /api/backup/export -> JSON con todos los datos del usuario
router.get('/export', (req, res) => {
  const data = {};
  for (const table of TABLES) {
    data[table] = db.prepare(`SELECT * FROM ${table}`).all();
  }
  data.user_name = db.prepare("SELECT value FROM settings WHERE key = 'user_name'").get()?.value || null;
  data.exported_at = new Date().toISOString();

  res.setHeader('Content-Disposition', `attachment; filename="personal-os-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(data);
});

// POST /api/backup/import -> reemplaza TODOS los datos con el respaldo dado
router.post('/import', (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Archivo de respaldo inválido' });
  }

  try {
    const tx = db.transaction(() => {
      // Borra en orden inverso para respetar llaves foráneas
      for (const table of [...TABLES].reverse()) {
        db.prepare(`DELETE FROM ${table}`).run();
      }

      for (const table of TABLES) {
        const rows = payload[table];
        if (!Array.isArray(rows) || rows.length === 0) continue;

        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(', ');
        const insert = db.prepare(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
        );
        rows.forEach((row) => insert.run(...columns.map((c) => row[c])));
      }

      if (payload.user_name) {
        db.prepare(
          `INSERT INTO settings (key, value, updated_at) VALUES ('user_name', ?, datetime('now'))
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
        ).run(payload.user_name);
      }
    });

    tx();
    res.json({ ok: true });
  } catch (err) {
    console.error('Error al importar respaldo:', err);
    res.status(500).json({ error: 'No se pudo importar el respaldo. Verifica que el archivo sea válido.' });
  }
});

export default router;
