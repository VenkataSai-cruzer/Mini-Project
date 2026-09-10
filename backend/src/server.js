/**
 * ZTGuard Backend Server
 * Express application entry point.
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const authRoutes      = require('./routes/auth');
const accessRoutes    = require('./routes/access');
const incidentRoutes  = require('./routes/incidents');
const auditRoutes     = require('./routes/audit');
const dashboardRoutes = require('./routes/dashboard');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in dev; tighten in production if needed
    }
  },
  credentials: true,
}));

app.use(express.json());

// Request logger (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/auth',      authRoutes);
app.use('/api/access',    accessRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/audit',     auditRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status:  'ok',
    version: '1.0.0',
    mode:    process.env.USE_IN_MEMORY === 'true' ? 'in-memory' : 'postgresql',
    time:    new Date().toISOString(),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n┌─────────────────────────────────────────┐`);
  console.log(`│  ZTGuard Backend                        │`);
  console.log(`│  http://localhost:${PORT}                  │`);
  console.log(`│  Mode: ${process.env.USE_IN_MEMORY === 'true' ? 'In-Memory (demo)    ' : 'PostgreSQL          '}         │`);
  console.log(`└─────────────────────────────────────────┘\n`);
});

module.exports = app;
