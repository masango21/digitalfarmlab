const SUPPORTED_ROLES = new Set(['learner', 'trainer', 'admin']);

function requireRole(...roles) {
  if (!roles.length || roles.some((role) => !SUPPORTED_ROLES.has(role))) {
    throw new Error('requireRole must be configured with supported roles');
  }

  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'You do not have permission to perform this action' });
      return;
    }
    next();
  };
}

module.exports = { requireRole };
