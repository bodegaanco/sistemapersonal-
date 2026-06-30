-- =========================================================
-- PERSONAL OS - ESQUEMA COMPLETO DE BASE DE DATOS (SQLite)
-- =========================================================
-- Diseñado con relaciones, integridad referencial y campos
-- de auditoría (created_at / updated_at) en todas las tablas.
-- =========================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------
-- CONFIGURACIÓN GENERAL
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------
-- ETIQUETAS / CATEGORÍAS (reutilizables en tareas y finanzas)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  color       TEXT DEFAULT '#6366f1',
  scope       TEXT NOT NULL DEFAULT 'general', -- general | task | finance
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------
-- CHECKLIST DIARIO
-- ---------------------------------------------------------
-- Plantilla de ítems fijos (lo que se repite todos los días)
CREATE TABLE IF NOT EXISTS checklist_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  icon        TEXT DEFAULT '✓',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1, -- 1 = visible en checklist diario
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Historial de cumplimiento por día (no se borra al cambiar de día)
CREATE TABLE IF NOT EXISTS checklist_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id       INTEGER NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,            -- YYYY-MM-DD
  completed     INTEGER NOT NULL DEFAULT 0,
  completed_at  TEXT,
  UNIQUE(item_id, date)
);

-- ---------------------------------------------------------
-- TAREAS VARIABLES (no fijas, con fecha/prioridad)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  notes       TEXT,
  priority    TEXT NOT NULL DEFAULT 'media', -- baja | media | alta
  due_date    TEXT,                          -- YYYY-MM-DD
  completed   INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS task_tags (
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- ---------------------------------------------------------
-- HÁBITOS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS habits (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  icon          TEXT DEFAULT '⭐',
  color         TEXT DEFAULT '#22c55e',
  frequency     TEXT NOT NULL DEFAULT 'daily', -- daily | weekly | custom
  target_per_week INTEGER DEFAULT 7,
  active        INTEGER NOT NULL DEFAULT 1,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id    INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date        TEXT NOT NULL, -- YYYY-MM-DD
  completed   INTEGER NOT NULL DEFAULT 0,
  UNIQUE(habit_id, date)
);

-- ---------------------------------------------------------
-- GYM
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS gym_routines (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  weekday     INTEGER NOT NULL,  -- 0=Lunes ... 6=Domingo
  name        TEXT NOT NULL,     -- ej: "Pecho"
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gym_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  routine_id  INTEGER REFERENCES gym_routines(id) ON DELETE SET NULL,
  date        TEXT NOT NULL,
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gym_exercise_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  INTEGER NOT NULL REFERENCES gym_sessions(id) ON DELETE CASCADE,
  exercise    TEXT NOT NULL,
  sets        INTEGER,
  reps        INTEGER,
  weight      REAL,
  notes       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------
-- FÚTBOL
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS futbol_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  date          TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'partido', -- partido | entrenamiento
  position      TEXT,
  minutes       INTEGER,
  goals         INTEGER DEFAULT 0,
  assists       INTEGER DEFAULT 0,
  physical_state TEXT,   -- ej: bien, cansado, lesionado
  feeling       TEXT,
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------
-- CALENDARIO
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT,
  start_date  TEXT NOT NULL, -- ISO datetime
  end_date    TEXT,
  all_day     INTEGER NOT NULL DEFAULT 0,
  repeat_rule TEXT,          -- none | daily | weekly | monthly
  reminder_minutes_before INTEGER,
  color       TEXT DEFAULT '#6366f1',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------
-- HORARIO SEMANAL FIJO
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule_blocks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  weekday     INTEGER NOT NULL, -- 0=Lunes ... 6=Domingo
  start_time  TEXT NOT NULL,    -- HH:MM
  end_time    TEXT,
  title       TEXT NOT NULL,
  color       TEXT DEFAULT '#6366f1',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------
-- FINANZAS PERSONALES
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS finance_categories (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL UNIQUE,
  type      TEXT NOT NULL, -- ingreso | gasto
  color     TEXT DEFAULT '#6366f1'
);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT NOT NULL, -- ingreso | gasto | transferencia
  amount        REAL NOT NULL,
  category_id   INTEGER REFERENCES finance_categories(id) ON DELETE SET NULL,
  description   TEXT,
  date          TEXT NOT NULL, -- YYYY-MM-DD
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------
-- OBJETIVOS / METAS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS goals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL NOT NULL DEFAULT 0,
  deadline      TEXT, -- YYYY-MM-DD
  icon          TEXT DEFAULT '🎯',
  completed     INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------
-- REGISTRO DIARIO (DIARIO PERSONAL)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_entries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  date          TEXT NOT NULL UNIQUE, -- YYYY-MM-DD
  how_was_day   TEXT,
  what_went_well TEXT,
  what_to_improve TEXT,
  mood          INTEGER, -- 1-5
  energy        INTEGER, -- 1-5
  productivity  INTEGER, -- 1-5
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------
-- ÍNDICES
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_checklist_logs_date ON checklist_logs(date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_finance_date ON finance_transactions(date);
CREATE INDEX IF NOT EXISTS idx_calendar_start ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_futbol_date ON futbol_logs(date);
