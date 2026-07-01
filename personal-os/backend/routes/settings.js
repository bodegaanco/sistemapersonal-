import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Claves que nunca deben salir hacia el cliente (secretos internos)
const HIDDEN_KEYS = new Set(['auth_password_hash']);

function getPublicSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.filter((r) => !HIDDEN_KEYS.has(r.key)).map((r) => [r.key, r.value]));
}

// GET /api/settings
router.get('/', (req, res) => {
  res.json(getPublicSettings());
});

// PUT /api/settings  body: { key: value, ... }
router.put('/', (req, res) => {
  const upsert = db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  );
  const tx = db.transaction((entries) => {
    entries.forEach(([k, v]) => {
      if (HIDDEN_KEYS.has(k)) return; // nunca permitir sobrescribir el hash por esta vía
      upsert.run(k, String(v));
    });
  });
  tx(Object.entries(req.body));

  res.json(getPublicSettings());
});

export default router;
