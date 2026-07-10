/* Pathfinder 1.1 durable data foundation.
   Stores the application shell and each daily record separately in IndexedDB,
   keeps compact emergency metadata in localStorage, and rotates last-known-good backups.
*/

export const FOUNDATION_SCHEMA_VERSION = 1;
export const FOUNDATION_DB_NAME = 'pathfinder-foundation';
export const FOUNDATION_DB_VERSION = 1;
export const FOUNDATION_POINTER_KEY = 'pathfinder.foundation.pointer.v1';
export const FOUNDATION_EMERGENCY_SHELL_KEY = 'pathfinder.foundation.shell.v1';

const META_STORE = 'meta';
const DAY_STORE = 'days';
const BACKUP_STORE = 'backups';
const MAIN_SHELL_ID = 'main-shell';
const MAX_BACKUPS = 3;
const BACKUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

let saveTimer = null;
let pendingDayKeys = new Set();
let pendingAllDays = false;
let pendingForceBackup = false;
let pendingBackupReason = 'scheduled';
let writeChain = Promise.resolve();

function clone(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function safeJsonParse(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}

function localStorageAvailable() {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function validDayKey(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(key || ''))) return false;
  const [year, month, day] = key.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  return value.getUTCFullYear() === year && value.getUTCMonth() === month - 1 && value.getUTCDate() === day;
}

export function stripDays(state) {
  const source = state && typeof state === 'object' ? state : {};
  const { days: _days, ...withoutDays } = source;
  const shell = clone(withoutDays);
  shell.foundation = {
    ...(shell.foundation || {}),
    schemaVersion: FOUNDATION_SCHEMA_VERSION,
    dayStore: DAY_STORE
  };
  return shell;
}

export function assembleState(shell, dayRecords = []) {
  const state = clone(shell || {});
  state.days = {};
  for (const record of dayRecords || []) {
    const key = record?.key;
    const day = record?.day ?? record;
    if (key && day && typeof day === 'object') state.days[key] = clone(day);
  }
  return state;
}

export function validateFoundationState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) throw new Error('Foundation state must be an object');
  if (!state.settings || typeof state.settings !== 'object' || Array.isArray(state.settings)) throw new Error('Foundation settings are invalid');
  if (!state.days || typeof state.days !== 'object' || Array.isArray(state.days)) throw new Error('Foundation days are invalid');
  const entries = Object.entries(state.days);
  if (entries.length > 5000) throw new Error('Foundation contains too many day records');
  for (const [key, day] of entries) {
    if (!validDayKey(key)) throw new Error(`Invalid foundation day key: ${key}`);
    if (!day || typeof day !== 'object' || Array.isArray(day)) throw new Error(`Invalid foundation day record: ${key}`);
    if (day.key && day.key !== key) throw new Error(`Mismatched foundation day key: ${key}`);
  }
  return { dayCount: entries.length };
}

export function newestBackups(records, max = MAX_BACKUPS) {
  return [...(records || [])]
    .sort((a, b) => Date.parse(b?.createdAt || '') - Date.parse(a?.createdAt || ''))
    .slice(0, max);
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open(FOUNDATION_DB_NAME, FOUNDATION_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(DAY_STORE)) db.createObjectStore(DAY_STORE, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(BACKUP_STORE)) db.createObjectStore(BACKUP_STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
  });
}

function transactionComplete(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}

async function readAll(storeName) {
  const db = await openDb();
  try {
    const tx = db.transaction(storeName, 'readonly');
    const done = transactionComplete(tx);
    const values = await requestResult(tx.objectStore(storeName).getAll());
    await done;
    return values || [];
  } finally {
    db.close();
  }
}

export function writeEmergencyMetadata(state, extra = {}) {
  if (!localStorageAvailable()) return false;
  const shell = stripDays(state);
  const previousPointer = safeJsonParse(localStorage.getItem(FOUNDATION_POINTER_KEY)) || {};
  const pointer = {
    foundationSchemaVersion: FOUNDATION_SCHEMA_VERSION,
    appVersion: state?.version || '',
    updatedAt: state?.meta?.updatedAt || new Date().toISOString(),
    dayCount: Object.keys(state?.days || {}).length,
    lastGoodBackupId: extra.lastGoodBackupId || previousPointer.lastGoodBackupId || '',
    ...extra
  };
  try {
    localStorage.setItem(FOUNDATION_EMERGENCY_SHELL_KEY, JSON.stringify(shell));
    localStorage.setItem(FOUNDATION_POINTER_KEY, JSON.stringify(pointer));
    return true;
  } catch {
    return false;
  }
}

export function readEmergencyMetadata() {
  if (!localStorageAvailable()) return { shell: null, pointer: null };
  return {
    shell: safeJsonParse(localStorage.getItem(FOUNDATION_EMERGENCY_SHELL_KEY)),
    pointer: safeJsonParse(localStorage.getItem(FOUNDATION_POINTER_KEY))
  };
}

async function createBackupRecord(state, reason = 'scheduled') {
  validateFoundationState(state);
  const db = await openDb();
  const createdAt = new Date().toISOString();
  const id = `${createdAt}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    const tx = db.transaction(BACKUP_STORE, 'readwrite');
    tx.objectStore(BACKUP_STORE).put({ id, createdAt, reason, state: clone(state) });
    await transactionComplete(tx);
  } finally {
    db.close();
  }

  const records = await readAll(BACKUP_STORE);
  const keep = new Set(newestBackups(records).map(record => record.id));
  const stale = records.filter(record => !keep.has(record.id));
  if (stale.length) {
    const cleanupDb = await openDb();
    try {
      const tx = cleanupDb.transaction(BACKUP_STORE, 'readwrite');
      stale.forEach(record => tx.objectStore(BACKUP_STORE).delete(record.id));
      await transactionComplete(tx);
    } finally {
      cleanupDb.close();
    }
  }
  return id;
}

export async function createFoundationBackup(state, reason = 'manual') {
  return enqueueWrite(() => createBackupRecord(state, reason));
}

async function shouldRotateBackup(forceBackup) {
  if (forceBackup) return true;
  const records = newestBackups(await readAll(BACKUP_STORE), 1);
  if (!records.length) return true;
  const age = Date.now() - Date.parse(records[0].createdAt || '');
  return !Number.isFinite(age) || age >= BACKUP_INTERVAL_MS;
}

export async function persistFoundationState(state, options = {}) {
  validateFoundationState(state);
  const dayKeys = new Set(options.dayKeys || []);
  const allDays = Boolean(options.allDays);
  const shell = stripDays(state);
  const db = await openDb();
  try {
    const tx = db.transaction([META_STORE, DAY_STORE], 'readwrite');
    tx.objectStore(META_STORE).put({
      id: MAIN_SHELL_ID,
      shell,
      updatedAt: state.meta?.updatedAt || new Date().toISOString(),
      appVersion: state.version || ''
    });
    const dayStore = tx.objectStore(DAY_STORE);
    if (allDays) dayStore.clear();
    const keysToWrite = allDays ? Object.keys(state.days || {}) : [...dayKeys];
    for (const key of keysToWrite) {
      const day = state.days?.[key];
      if (day) dayStore.put({ key, day: clone(day), updatedAt: state.meta?.updatedAt || new Date().toISOString() });
      else dayStore.delete(key);
    }
    await transactionComplete(tx);
  } finally {
    db.close();
  }

  let backupId = '';
  if (await shouldRotateBackup(Boolean(options.forceBackup))) {
    backupId = await createBackupRecord(state, options.backupReason || 'scheduled');
  }
  writeEmergencyMetadata(state, { lastGoodBackupId: backupId || undefined });
  return { dayCount: Object.keys(state.days || {}).length, backupId };
}

function enqueueWrite(task) {
  writeChain = writeChain.then(task, task);
  return writeChain;
}

export function queueFoundationSave(getState, options = {}) {
  for (const key of options.dayKeys || []) pendingDayKeys.add(key);
  pendingAllDays = pendingAllDays || Boolean(options.allDays);
  pendingForceBackup = pendingForceBackup || Boolean(options.forceBackup);
  if (options.backupReason) pendingBackupReason = options.backupReason;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const result = await flushFoundationSave(getState);
      options.onSuccess?.(result);
    } catch (error) {
      options.onError?.(error);
      console.warn('Pathfinder foundation save failed:', error);
    }
  }, Number(options.delay ?? 350));
}

export async function flushFoundationSave(getState, options = {}) {
  clearTimeout(saveTimer);
  for (const key of options.dayKeys || []) pendingDayKeys.add(key);
  pendingAllDays = pendingAllDays || Boolean(options.allDays);
  pendingForceBackup = pendingForceBackup || Boolean(options.forceBackup);
  if (options.backupReason) pendingBackupReason = options.backupReason;

  const dayKeys = [...pendingDayKeys];
  const allDays = pendingAllDays;
  const forceBackup = pendingForceBackup;
  const backupReason = pendingBackupReason;
  pendingDayKeys = new Set();
  pendingAllDays = false;
  pendingForceBackup = false;
  pendingBackupReason = 'scheduled';

  const state = clone(typeof getState === 'function' ? getState() : getState);
  try {
    return await enqueueWrite(() => persistFoundationState(state, { dayKeys, allDays, forceBackup, backupReason }));
  } catch (error) {
    for (const key of dayKeys) pendingDayKeys.add(key);
    pendingAllDays = pendingAllDays || allDays;
    pendingForceBackup = pendingForceBackup || forceBackup;
    if (backupReason && backupReason !== 'scheduled') pendingBackupReason = backupReason;
    throw error;
  }
}

export async function loadFoundationCandidates() {
  const candidates = [];
  try {
    const db = await openDb();
    try {
      const tx = db.transaction([META_STORE, DAY_STORE], 'readonly');
      const done = transactionComplete(tx);
      const shellRecordPromise = requestResult(tx.objectStore(META_STORE).get(MAIN_SHELL_ID));
      const dayRecordsPromise = requestResult(tx.objectStore(DAY_STORE).getAll());
      const [shellRecord, dayRecords] = await Promise.all([shellRecordPromise, dayRecordsPromise]);
      await done;
      if (shellRecord?.shell) {
        candidates.push({
          source: 'IndexedDB primary',
          state: assembleState(shellRecord.shell, dayRecords),
          updatedAt: shellRecord.updatedAt || ''
        });
      }
    } finally {
      db.close();
    }
  } catch (error) {
    if (!String(error?.message || error).includes('unavailable')) console.warn('Pathfinder foundation primary read failed:', error);
  }

  try {
    const backups = newestBackups(await readAll(BACKUP_STORE));
    for (const backup of backups) {
      if (backup?.state) candidates.push({
        source: `IndexedDB last-known-good backup (${backup.reason || 'backup'})`,
        state: clone(backup.state),
        updatedAt: backup.createdAt || ''
      });
    }
  } catch (error) {
    if (!String(error?.message || error).includes('unavailable')) console.warn('Pathfinder backup read failed:', error);
  }
  return candidates;
}

export async function getFoundationDiagnostics() {
  const emergency = readEmergencyMetadata();
  let primaryExists = false;
  let dayCount = 0;
  let backupCount = 0;
  let newestBackupAt = '';
  let updatedAt = '';
  try {
    const db = await openDb();
    try {
      const tx = db.transaction([META_STORE, DAY_STORE], 'readonly');
      const done = transactionComplete(tx);
      const shellPromise = requestResult(tx.objectStore(META_STORE).get(MAIN_SHELL_ID));
      const countPromise = requestResult(tx.objectStore(DAY_STORE).count());
      const [shell, count] = await Promise.all([shellPromise, countPromise]);
      await done;
      primaryExists = Boolean(shell?.shell);
      dayCount = Number(count || 0);
      updatedAt = shell?.updatedAt || '';
    } finally {
      db.close();
    }
    const backups = newestBackups(await readAll(BACKUP_STORE));
    backupCount = backups.length;
    newestBackupAt = backups[0]?.createdAt || '';
    return {
      available: true,
      primaryExists,
      dayCount,
      backupCount,
      newestBackupAt,
      updatedAt,
      emergencyShellExists: Boolean(emergency.shell),
      pointerExists: Boolean(emergency.pointer),
      pointer: emergency.pointer || null
    };
  } catch (error) {
    return {
      available: false,
      primaryExists: false,
      dayCount: 0,
      backupCount: 0,
      newestBackupAt: '',
      updatedAt: '',
      emergencyShellExists: Boolean(emergency.shell),
      pointerExists: Boolean(emergency.pointer),
      pointer: emergency.pointer || null,
      error: error?.message || String(error)
    };
  }
}

export async function runFoundationSaveTest() {
  const id = `save-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const payload = { id, value: Math.random().toString(36), writtenAt: new Date().toISOString() };
  let indexedDbPassed = false;
  let localMetadataPassed = false;
  const details = [];

  try {
    const db = await openDb();
    try {
      const writeTx = db.transaction(META_STORE, 'readwrite');
      writeTx.objectStore(META_STORE).put(payload);
      await transactionComplete(writeTx);
      const readTx = db.transaction(META_STORE, 'readonly');
      const readDone = transactionComplete(readTx);
      const readBack = await requestResult(readTx.objectStore(META_STORE).get(id));
      await readDone;
      indexedDbPassed = readBack?.value === payload.value;
      const deleteTx = db.transaction(META_STORE, 'readwrite');
      deleteTx.objectStore(META_STORE).delete(id);
      await transactionComplete(deleteTx);
      details.push(indexedDbPassed ? 'IndexedDB passed' : 'IndexedDB verification failed');
    } finally {
      db.close();
    }
  } catch (error) {
    details.push(`IndexedDB failed: ${error?.message || error}`);
  }

  try {
    if (!localStorageAvailable()) throw new Error('localStorage unavailable');
    const key = `${FOUNDATION_POINTER_KEY}.test`;
    const raw = JSON.stringify(payload);
    localStorage.setItem(key, raw);
    localMetadataPassed = localStorage.getItem(key) === raw;
    localStorage.removeItem(key);
    details.push(localMetadataPassed ? 'emergency metadata passed' : 'emergency metadata verification failed');
  } catch (error) {
    details.push(`emergency metadata failed: ${error?.message || error}`);
  }

  return {
    status: indexedDbPassed && localMetadataPassed ? 'passed' : indexedDbPassed ? 'degraded' : 'failed',
    indexedDbPassed,
    localMetadataPassed,
    details
  };
}
