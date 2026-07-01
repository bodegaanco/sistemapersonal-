import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRouter from './routes/auth.js';
import checklistRouter from './routes/checklist.js';
import tasksRouter from './routes/tasks.js';
import habitsRouter from './routes/habits.js';
import settingsRouter from './routes/settings.js';
import dashboardRouter from './routes/dashboard.js';
import gymRouter from './routes/gym.js';
import futbolRouter from './routes/futbol.js';
import calendarRouter from './routes/calendar.js';
import scheduleRouter from './routes/schedule.js';
import financeRouter from './routes/finance.js';
import goalsRouter from './routes/goals.js';
import { requireAuth } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));

// En desarrollo el frontend corre en otro puerto (Vite, :5173), así que
// necesitamos CORS con credenciales habilitadas. En producción el frontend
// se sirve desde el mismo origen (no se necesita CORS).
if (NODE_ENV !== 'production') {
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    })
  );
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Rutas de autenticación: /login, /logout y /me son públicas;
// /change-password se protege a nivel de ruta dentro de auth.js
app.use('/api/auth', authRouter);

// Todo lo demás bajo /api requiere sesión activa
app.use('/api/checklist', requireAuth, checklistRouter);
app.use('/api/tasks', requireAuth, tasksRouter);
app.use('/api/habits', requireAuth, habitsRouter);
app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/gym', requireAuth, gymRouter);
app.use('/api/futbol', requireAuth, futbolRouter);
app.use('/api/calendar', requireAuth, calendarRouter);
app.use('/api/schedule', requireAuth, scheduleRouter);
app.use('/api/finance', requireAuth, financeRouter);
app.use('/api/goals', requireAuth, goalsRouter);

// En producción, Express también sirve el frontend ya compilado
// (frontend/dist), para que todo corra como un solo servicio — ideal
// para plataformas como Railway.
if (NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get(/^\/(?!api).*/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.warn('⚠️  No se encontró frontend/dist. Ejecuta "npm run build" en frontend/ antes de producción.');
  }
}

// Manejo de errores genérico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`✅ Personal OS backend corriendo en http://localhost:${PORT} (${NODE_ENV})`);
});
