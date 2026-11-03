const jwt = require('jsonwebtoken');

function requireSecret(name) {
  const secret = process.env[name];
  if (!secret) {
    throw new Error(`${name} is not configured`);
  }
  return secret;
}

function requireAuth(req, res, next) {
  const authorization = req.get('authorization');
  const match = authorization && authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: 'A bearer access token is required' });
    return;
  }

  try {
    const payload = jwt.verify(match[1], requireSecret('JWT_SECRET'), {
      algorithms: ['HS256'],
      issuer: 'digitalfarmlab-api',
      audience: 'digitalfarmlab-mobile',
    });

    if (typeof payload !== 'object' || payload.tokenType !== 'access' || !payload.sub) {
      res.status(401).json({ error: 'Invalid access token' });
      return;
    }

    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Invalid or expired access token' });
      return;
    }
    next(error);
  }
}

module.exports = { requireAuth, requireSecret };
