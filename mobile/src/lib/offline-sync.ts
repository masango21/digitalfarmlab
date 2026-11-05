import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface OfflineWrite {
  id: string;
  entity: string;
  owner: string;
  payload: Record<string, unknown>;
  status: 'queued' | 'failed' | 'synced' | 'conflict';
  attempts: number;
  createdAt: string;
  updatedAt: string;
  conflict: boolean;
  error: string | null;
}

interface OfflineWriteInput {
  id?: string;
  entity: string;
  owner: string;
  payload: Record<string, unknown>;
  status?: OfflineWrite['status'];
  attempts?: number;
  createdAt?: string;
  updatedAt?: string;
  conflict?: boolean;
  error?: string | null;
}

function makeWriteId(prefix = 'write') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => stableStringify(item)));
  }

  return JSON.stringify(Object.keys(value as Record<string, unknown>).sort().reduce((result, key) => {
    result[key] = (value as Record<string, unknown>)[key];
    return result;
  }, {} as Record<string, unknown>));
}

export function normalizeWrite(input: OfflineWriteInput): OfflineWrite {
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

export function enqueueWrite(queue: OfflineWrite[], input: OfflineWriteInput): OfflineWrite[] {
  const nextQueue = [...queue];
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

export function findConflicts(queue: OfflineWrite[], candidate: OfflineWriteInput): OfflineWrite[] {
  const target = normalizeWrite(candidate);
  return queue.filter((item) => {
    if (item.id === target.id) return false;
    if (item.entity !== target.entity || item.owner !== target.owner) return false;
    if (item.status === 'synced') return false;
    return stableStringify(item.payload) !== stableStringify(target.payload);
  });
}

export function shouldRetryWrite(write: OfflineWrite | null | undefined, maxAttempts = 3): boolean {
  if (!write || write.status === 'synced') return false;
  return Number(write.attempts || 0) < Number(maxAttempts);
}

export function markWriteSynced(queue: OfflineWrite[], id: string): OfflineWrite[] {
  return queue.filter((item) => item.id !== id);
}

const DEFAULT_STORAGE_KEY = 'digitalfarmlab.offlineQueue';

async function readStorageValue(key: string) {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function writeStorageValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function loadPendingWrites(storageKey = DEFAULT_STORAGE_KEY): Promise<OfflineWrite[]> {
  const raw = await readStorageValue(storageKey);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((entry) => normalizeWrite(entry as OfflineWriteInput)) : [];
  } catch {
    return [];
  }
}

export async function persistPendingWrites(queue: OfflineWrite[], storageKey = DEFAULT_STORAGE_KEY): Promise<OfflineWrite[]> {
  await writeStorageValue(storageKey, JSON.stringify(queue));
  return queue;
}

export async function queueLocalWrite(
  entity: string,
  owner: string,
  payload: Record<string, unknown>,
  storageKey = DEFAULT_STORAGE_KEY,
): Promise<OfflineWrite[]> {
  const queue = await loadPendingWrites(storageKey);
  const nextQueue = enqueueWrite(queue, { entity, owner, payload });
  await persistPendingWrites(nextQueue, storageKey);
  return nextQueue;
}

export async function syncPendingWrites(
  syncFn: (entry: OfflineWrite) => Promise<boolean>,
  storageKey = DEFAULT_STORAGE_KEY,
): Promise<{ synced: number; failed: number; conflicts: number }> {
  const queue = await loadPendingWrites(storageKey);
  const remaining: OfflineWrite[] = [];
  let synced = 0;
  let failed = 0;
  let conflicts = 0;

  for (const entry of queue) {
    if (findConflicts(queue, entry).length > 0) {
      conflicts += 1;
      remaining.push({ ...entry, status: 'conflict', conflict: true, updatedAt: new Date().toISOString() });
      continue;
    }

    if (!shouldRetryWrite(entry)) {
      remaining.push(entry);
      continue;
    }

    try {
      const succeeded = await syncFn(entry);
      if (succeeded) {
        synced += 1;
      } else {
        failed += 1;
        remaining.push({
          ...entry,
          status: 'failed',
          attempts: Number(entry.attempts || 0) + 1,
          updatedAt: new Date().toISOString(),
          error: 'Sync attempt failed',
        });
      }
    } catch {
      failed += 1;
      remaining.push({
        ...entry,
        status: 'failed',
        attempts: Number(entry.attempts || 0) + 1,
        updatedAt: new Date().toISOString(),
        error: 'Sync attempt failed',
      });
    }
  }

  await persistPendingWrites(remaining, storageKey);
  return { synced, failed, conflicts };
}
