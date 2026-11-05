function makeWriteId(prefix = 'write') {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}-${random}`;
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => stableStringify(item)));
  }

  return JSON.stringify(Object.keys(value).sort().reduce((result, key) => {
    result[key] = value[key];
    return result;
  }, {}));
}

function normalizeWrite(input) {
  const payload = typeof input.payload === 'undefined' ? {} : input.payload;

  return {
    id: input.id || makeWriteId(),
    entity: String(input.entity || 'record'),
    owner: String(input.owner || 'local-user'),
    payload,
    status: input.status || 'queued',
    attempts: Number.isFinite(input.attempts) ? Number(input.attempts) : 0,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || new Date().toISOString(),
    conflict: Boolean(input.conflict),
    error: input.error || null,
  };
}

function enqueueWrite(queue, input) {
  const nextQueue = Array.isArray(queue) ? [...queue] : [];
  const write = normalizeWrite(input);
  const hasDuplicate = nextQueue.some((item) => {
    if (item.entity !== write.entity || item.owner !== write.owner) return false;
    if (item.status === 'synced') return false;
    return stableStringify(item.payload) === stableStringify(write.payload);
  });

  if (hasDuplicate) return nextQueue;

  nextQueue.push(write);
  return nextQueue;
}

function findConflicts(queue, candidate) {
  if (!Array.isArray(queue)) return [];

  const target = normalizeWrite(candidate);
  return queue.filter((item) => {
    if (item.id === target.id) return false;
    if (item.entity !== target.entity || item.owner !== target.owner) return false;
    if (item.status === 'synced') return false;
    return stableStringify(item.payload) !== stableStringify(target.payload);
  });
}

function shouldRetryWrite(write, maxAttempts = 3) {
  if (!write || write.status === 'synced') return false;
  return Number(write.attempts || 0) < Number(maxAttempts);
}

function markWriteSynced(queue, id) {
  return (Array.isArray(queue) ? queue : []).filter((item) => item.id !== id);
}

module.exports = {
  enqueueWrite,
  findConflicts,
  makeWriteId,
  markWriteSynced,
  normalizeWrite,
  shouldRetryWrite,
};
