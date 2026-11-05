const { createHash } = require('node:crypto');
const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const { query, pool } = require('../db');
const { requireAuth, requireRole, requireSecret } = require('../middleware/auth');
const { validateRegistrationRole, validateUserRole } = require('../lib/auth-validation');

const router = express.Router();
const publicUserFields = 'id, display_name, email, role, avatar_url, created_at';

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function createTokens(user) {
  const claims = { sub: user.id };
  const accessToken = jwt.sign(
    { ...claims, tokenType: 'access' },
    requireSecret('JWT_SECRET'),
    { expiresIn: '15m', issuer: 'digitalfarmlab-api', audience: 'digitalfarmlab-mobile' },
  );
  const refreshToken = jwt.sign(
    { ...claims, tokenType: 'refresh' },
    requireSecret('JWT_REFRESH_SECRET'),
    { expiresIn: '30d', issuer: 'digitalfarmlab-api', audience: 'digitalfarmlab-mobile' },
  );
  return { accessToken, refreshToken };
}

async function saveRefreshToken(client, userId, token) {
  await client.query(
    'INSERT INTO refresh_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval \'30 days\')',
    [userId, tokenHash(token)],
  );
}

router.post('/register', async (req, res, next) => {
  const { displayName, email, password, role } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (typeof displayName !== 'string' || displayName.trim().length < 2 || displayName.trim().length > 100) {
    res.status(400).json({ error: 'Display name must be between 2 and 100 characters' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    res.status(400).json({ error: 'A valid email address is required' });
    return;
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    res.status(400).json({ error: 'Password must be between 8 and 72 characters' });
    return;
  }
  const roleError = validateRegistrationRole(role);
  if (roleError) {
    res.status(400).json({ error: roleError });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO users (display_name, email, password_hash, role)
         VALUES ($1, $2, $3, $4) RETURNING ${publicUserFields}`,
        [displayName.trim(), normalizedEmail, passwordHash, 'learner'],
      );
      const user = result.rows[0];
      const tokens = createTokens(user);
      await saveRefreshToken(client, user.id, tokens.refreshToken);
      await client.query('COMMIT');
      res.status(201).json({ user, ...tokens });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        res.status(409).json({ error: 'An account with this email already exists' });
        return;
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/role', requireAuth, requireRole('admin'), async (req, res, next) => {
  const userId = req.params.id;
  const { role } = req.body || {};
  const roleError = validateUserRole(role);
  if (roleError) {
    res.status(400).json({ error: roleError });
    return;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    res.status(400).json({ error: 'A valid user ID is required' });
    return;
  }
  if (userId.toLowerCase() === req.user.id.toLowerCase()) {
    res.status(400).json({ error: 'Administrators cannot change their own role' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(684231)');
    const target = await client.query('SELECT id, role FROM users WHERE id = $1 FOR UPDATE', [userId]);
    if (!target.rows[0]) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (target.rows[0].role === 'admin' && role !== 'admin') {
      const admins = await client.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'");
      if (admins.rows[0].count <= 1) {
        await client.query('ROLLBACK');
        res.status(409).json({ error: 'The last administrator cannot be demoted' });
        return;
      }
    }

    const result = await client.query(
      `UPDATE users SET role = $2, updated_at = now()
       WHERE id = $1
       RETURNING id, display_name, email, role, avatar_url, created_at`,
      [userId, role],
    );
    await client.query(
      'UPDATE refresh_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId],
    );
    await client.query('COMMIT');
    res.json({ user: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const result = await query(
      `SELECT ${publicUserFields}, password_hash FROM users WHERE email = $1`,
      [normalizedEmail],
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Email or password is incorrect' });
      return;
    }

    const { password_hash: _passwordHash, ...safeUser } = user;
    const tokens = createTokens(safeUser);
    const client = await pool.connect();
    try {
      await saveRefreshToken(client, safeUser.id, tokens.refreshToken);
    } finally {
      client.release();
    }
    res.json({ user: safeUser, ...tokens });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  const { refreshToken } = req.body || {};
  if (typeof refreshToken !== 'string') {
    res.status(400).json({ error: 'Refresh token is required' });
    return;
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, requireSecret('JWT_REFRESH_SECRET'), {
      algorithms: ['HS256'],
      issuer: 'digitalfarmlab-api',
      audience: 'digitalfarmlab-mobile',
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }
    next(error);
    return;
  }

  if (typeof payload !== 'object' || payload.tokenType !== 'refresh' || !payload.sub) {
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const deleted = await client.query(
      `DELETE FROM refresh_sessions
       WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL AND expires_at > now()
       RETURNING user_id`,
      [payload.sub, tokenHash(refreshToken)],
    );
    if (!deleted.rowCount) {
      await client.query('ROLLBACK');
      res.status(401).json({ error: 'Refresh token has already been used or revoked' });
      return;
    }

    const userResult = await client.query(
      `SELECT ${publicUserFields} FROM users WHERE id = $1`,
      [payload.sub],
    );
    if (!userResult.rows[0]) {
      await client.query('ROLLBACK');
      res.status(401).json({ error: 'Account no longer exists' });
      return;
    }

    const user = userResult.rows[0];
    const tokens = createTokens(user);
    await saveRefreshToken(client, user.id, tokens.refreshToken);
    await client.query('COMMIT');
    res.json({ user, ...tokens });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.post('/logout', async (req, res, next) => {
  const { refreshToken } = req.body || {};
  if (typeof refreshToken !== 'string') {
    res.status(400).json({ error: 'Refresh token is required' });
    return;
  }

  try {
    await query(
      'UPDATE refresh_sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL',
      [tokenHash(refreshToken)],
    );
    res.json({ message: 'Logged out' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
