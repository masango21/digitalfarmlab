const assert = require('node:assert/strict');
const test = require('node:test');
const { validateRegistrationRole, validateUserRole } = require('../lib/auth-validation');
const { requireRole } = require('../lib/authorization');

test('public registration defaults to learner and cannot request elevated roles', () => {
  assert.equal(validateRegistrationRole(undefined), null);
  assert.equal(validateRegistrationRole('learner'), null);
  assert.match(validateRegistrationRole('trainer'), /administrator/);
  assert.match(validateRegistrationRole('admin'), /administrator/);
  assert.match(validateRegistrationRole('unknown'), /administrator/);
});

test('role middleware allows only explicitly authorized database roles', () => {
  const trainerOnly = requireRole('trainer');
  let passed = false;
  const response = {
    statusCode: 0,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
    },
  };

  trainerOnly({ user: { role: 'learner' } }, response, () => { passed = true; });
  assert.equal(response.statusCode, 403);
  assert.equal(passed, false);

  trainerOnly({ user: { role: 'trainer' } }, response, () => { passed = true; });
  assert.equal(passed, true);

  assert.throws(() => requireRole('superuser'), /supported roles/);
});

test('administrators may assign only supported account roles', () => {
  for (const role of ['learner', 'trainer', 'admin']) {
    assert.equal(validateUserRole(role), null);
  }
  for (const role of [undefined, 'owner', '', null]) {
    assert.match(validateUserRole(role), /learner, trainer, or admin/);
  }
});
