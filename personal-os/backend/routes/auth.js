import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { JWT_SECRET, requireAuth } from '../middleware/auth.js';

const router = Router();
const COOKIE_NAME = 'token';
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd, // requiere HTTPS en producción (Railway lo da por defecto)
    sameSite: 'lax',
    maxAge: THIRTY_DAYS,
  };
}

// POST /api/auth/login  { password }
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Falta la contraseña' });

  const row = db.prepare("SELECT value FROM settings WHERE key = 'auth_password_hash'").get();
  if (!row) return res.status(500).json({ error: 'La aplicación no tiene una contraseña configurada' });

  const valid = bcrypt.compareSync(password, row.value);
  if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

  const token = jwt.sign({ auth: true }, JWT_SECRET, { expiresIn: '30d' });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ ok: true });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json({ ok: true });
});

// GET /api/auth/me -> indica si la sesión actual es válida
router.get('/me', (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.json({ authenticated: false });
  try {
    jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true });
  } catch {
    res.json({ authenticated: false });
  }
});

// POST /api/auth/change-password  { currentPassword, newPassword }
// Requiere sesión activa (se monta detrás de requireAuth en server.js)
router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  const row = db.prepare("SELECT value FROM settings WHERE key = 'auth_password_hash'").get();
  if (!bcrypt.compareSync(currentPassword, row.value)) {
    return res.status(401).json({ error: 'La contraseña actual no es correcta' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES ('auth_password_hash', ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(newHash);

  res.json({ ok: true });
});

export default router;
