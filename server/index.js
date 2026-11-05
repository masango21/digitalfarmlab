require('dotenv').config();

const cors = require('cors');
const express = require('express');
const analyticsRoutes = require('./routes/analytics');
const authRoutes = require('./routes/auth');
const cohortRoutes = require('./routes/cohorts');
const communityRoutes = require('./routes/community');
const cropLibraryRoutes = require('./routes/crop-library');
const dashboardRoutes = require('./routes/dashboard');
const farmRoutes = require('./routes/farms');
const fieldRecordRoutes = require('./routes/field-records');
const journalRoutes = require('./routes/journal');
const leaderboardRoutes = require('./routes/leaderboard');
const marketRoutes = require('./routes/market');
const notificationRoutes = require('./routes/notifications');
const profileRoutes = require('./routes/profile');
const reportsRoutes = require('./routes/reports');
const scenarioRoutes = require('./routes/scenarios');

const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:8081,http://localhost:8082,http://localhost:8083,http://localhost:8084,http://localhost:8098,http://localhost:19006')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedLocalOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
}

app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || isAllowedLocalOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/crop-library', cropLibraryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api', fieldRecordRoutes);
app.use('/api/cohorts', cohortRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Request body must contain valid JSON' });
    return;
  }

  if (error.message === 'Origin is not allowed by CORS') {
    res.status(403).json({ error: error.message });
    return;
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'Image must be 5 MB or smaller' });
    return;
  }

  if (error.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body is too large' });
    return;
  }

  if (error.message === 'Only image files are allowed') {
    res.status(400).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(error.statusCode || 500).json({
    error: error.statusCode ? error.message : 'Internal server error',
  });
});

const port = Number(process.env.PORT || 5000);
const server = app.listen(port, () => {
  console.log(`DigitalFarmLab API listening on port ${port}`);
});

function shutdown() {
  server.close(() => {
    const { pool } = require('./db');
    pool.end().then(
      () => process.exit(0),
      (error) => {
        console.error('Unable to close the PostgreSQL pool cleanly', error);
        process.exit(1);
      },
    );
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
