const USER_ROLES = new Set(['learner', 'trainer', 'admin']);

function validateRegistrationRole(role) {
  if (role === undefined || role === 'learner') return null;
  return 'New accounts are created as learners. Ask an administrator to change your role.';
}

function validateUserRole(role) {
  return USER_ROLES.has(role) ? null : 'Role must be learner, trainer, or admin';
}

module.exports = { validateRegistrationRole, validateUserRole };
