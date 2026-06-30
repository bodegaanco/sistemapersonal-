import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_PATH = path.join(DATA_DIR, 'personal-os.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Usamos el módulo nativo node:sqlite (incluido en Node.js >= 22.5) para
// evitar compilaciones nativas (node-gyp) que suelen fallar según el entorno.
const rawDb = new DatabaseSync(DB_PATH);
rawDb.exec('PRAGMA journal_mode = WAL;');
rawDb.exec('PRAGMA foreign_keys = ON;');

// Pequeña capa de compatibilidad con la API estilo better-sqlite3 que usan
// las rutas (db.prepare(sql).run/get/all, db.exec, db.transaction).
const statementCache = new Map();
function getStatement(sql) {
  if (!statementCache.has(sql)) {
    statementCache.set(sql, rawDb.prepare(sql));
  }
  return statementCache.get(sql);
}

const db = {
  exec(sql) {
    return rawDb.exec(sql);
  },
  prepare(sql) {
    const stmt = getStatement(sql);
    return {
      run: (...params) => stmt.run(...params),
      get: (...params) => stmt.get(...params),
      all: (...params) => stmt.all(...params),
    };
  },
  transaction(fn) {
    return (...args) => {
      rawDb.exec('BEGIN');
      try {
        const result = fn(...args);
        rawDb.exec('COMMIT');
        return result;
      } catch (err) {
        rawDb.exec('ROLLBACK');
        throw err;
      }
    };
  },
};

// Aplica el esquema (idempotente: usa CREATE TABLE IF NOT EXISTS)
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);

// Datos por defecto: checklist diario fijo, si la tabla está vacía
const checklistCount = db.prepare('SELECT COUNT(*) as c FROM checklist_items').get().c;
if (checklistCount === 0) {
  const defaultItems = [
    ['Hacer la cama', '🛏️'],
    ['Lavarse los dientes', '🦷'],
    ['Ducharse', '🚿'],
    ['Tomar agua', '💧'],
    ['Leer 20 minutos', '📖'],
    ['Ordenar la pieza', '🧹'],
    ['Entrenar', '💪'],
    ['Estudiar', '📚'],
    ['Dormir antes de cierta hora', '🌙'],
  ];
  const insert = db.prepare('INSERT INTO checklist_items (title, icon, sort_order) VALUES (?, ?, ?)');
  defaultItems.forEach(([title, icon], i) => insert.run(title, icon, i));
}

// Hábitos por defecto
const habitsCount = db.prepare('SELECT COUNT(*) as c FROM habits').get().c;
if (habitsCount === 0) {
  const defaultHabits = [
    ['Leer', '📖', '#22c55e'],
    ['Tomar agua', '💧', '#0ea5e9'],
    ['Dormir temprano', '🌙', '#8b5cf6'],
    ['Meditar', '🧘', '#f59e0b'],
    ['Hacer la cama', '🛏️', '#ec4899'],
    ['Entrenar', '💪', '#ef4444'],
  ];
  const insert = db.prepare('INSERT INTO habits (title, icon, color, sort_order) VALUES (?, ?, ?, ?)');
  defaultHabits.forEach(([title, icon, color], i) => insert.run(title, icon, color, i));
}

// Configuración por defecto
const settingsDefaults = {
  user_name: 'Francisco',
  theme: 'dark',
};
const upsertSetting = db.prepare(
  'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING'
);
Object.entries(settingsDefaults).forEach(([k, v]) => upsertSetting.run(k, v));

// ---------------------------------------------------------
// CONTRASEÑA DE LA APLICACIÓN
// ---------------------------------------------------------
// Si la variable de entorno APP_PASSWORD está definida, se usa (y se
// actualiza el hash guardado) cada vez que arranca el servidor — esto
// permite "resetear" la contraseña simplemente cambiando la variable de
// entorno y reiniciando. Si no hay hash guardado y tampoco hay
// APP_PASSWORD, se usa una contraseña por defecto que DEBES cambiar.
const DEFAULT_PASSWORD = 'cambiame123';
const existingHash = db.prepare("SELECT value FROM settings WHERE key = 'auth_password_hash'").get();

if (process.env.APP_PASSWORD) {
  const hash = bcrypt.hashSync(process.env.APP_PASSWORD, 10);
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES ('auth_password_hash', ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(hash);
} else if (!existingHash) {
  const hash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  db.prepare("INSERT INTO settings (key, value) VALUES ('auth_password_hash', ?)").run(hash);
  console.warn(
    `⚠️  No se definió APP_PASSWORD. Usando contraseña por defecto: "${DEFAULT_PASSWORD}". Cámbiala en Ajustes lo antes posible.`
  );
}

export default db;
