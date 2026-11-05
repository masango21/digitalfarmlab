const assert = require('node:assert/strict');
const test = require('node:test');

const { enqueueWrite, findConflicts, markWriteSynced, shouldRetryWrite } = require('../lib/offline');

test('queued writes keep ownership and retry metadata while they wait to sync', () => {
  const queue = [];
  const result = enqueueWrite(queue, {
    entity: 'farm',
    owner: 'learner-1',
    payload: { name: 'Green Valley' },
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].entity, 'farm');
  assert.equal(result[0].owner, 'learner-1');
  assert.equal(result[0].status, 'queued');
  assert.equal(result[0].attempts, 0);
});

test('conflicts are detected when a queued write targets the same record with different content', () => {
  const queue = [
    {
      id: 'write-1',
      entity: 'farm',
      owner: 'learner-1',
      payload: { name: 'Green Valley', version: 1 },
      status: 'queued',
      attempts: 0,
    },
  ];

  const conflicts = findConflicts(queue, {
    entity: 'farm',
    owner: 'learner-1',
    payload: { name: 'North Valley', version: 2 },
  });

  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].id, 'write-1');
});

test('retryable writes are kept pending until they either sync or are explicitly cleared', () => {
  const write = {
    id: 'write-2',
    entity: 'field',
    owner: 'learner-1',
    payload: { name: 'North plot' },
    status: 'failed',
    attempts: 2,
  };

  assert.equal(shouldRetryWrite(write), true);

  const synced = markWriteSynced([write], 'write-2');
  assert.equal(synced.length, 0);
});
