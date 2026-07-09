(() => {
  const BOOTSTRAP_VERSION = '0.8.8';
  const RELEASE_LABEL = '0.8.8 Data Safety Cleanup';
  const CORE_APP_VERSION = '0.8.8 runtime-patched from 0.8.6 core';
  const SERVICE_WORKER_CACHE = 'pathfinder-0.8.8';
  const STORAGE_KEY = 'pathfinder.state.v8';
  const STORAGE_BACKUP_KEY = 'pathfinder.state.v8.backup';
  const LEGACY_KEYS = ['pathfinder.state.v8.backup', 'pathfinder.state.v7', 'pathfinder.state.v1', 'pathfinder.0.1.state'];
  const IDB_DB_NAME = 'pathfinder-local-state';
  const IDB_STORE_NAME = 'state';
  const IDB_STATE_KEY = 'main';
  const APP_SCRIPT = './app.js?v=0.8.8';
  const BOOTSTRAP_STATUS_KEY = 'pathfinder.bootstrap.status.v1';
  const SAFETY_AUDIT_KEY = 'pathfinder.data-safety.audit.v1';

  const status = { version: BOOTSTRAP_VERSION, release: RELEASE_LABEL, coreAppVersion: CORE_APP_VERSION, serviceWorkerCache: SERVICE_WORKER_CACHE, startedAt: new Date().toISOString(), loadedSource: 'unknown', restoredFromIndexedDb: false, restoredFromBackup: false, runtimePatched: false, error: '' };
  window.__PATHFINDER_RELEASE__ = { release: RELEASE_LABEL, bootstrapVersion: BOOTSTRAP_VERSION, coreAppVersion: CORE_APP_VERSION, serviceWorkerCache: SERVICE_WORKER_CACHE };

  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
  function setLoadingMessage(message) { const app = document.querySelector('#app'); if (!app) return; app.innerHTML = `<section class="card highlight"><h2>Loading Pathfinder…</h2><p>${escapeHtml(message)}</p></section>`; }
  function safeParse(raw) { if (!raw) return null; try { const parsed = JSON.parse(raw); return parsed && typeof parsed === 'object' ? parsed : null; } catch { return null; } }
  function localGet(key) { try { return localStorage.getItem(key); } catch (error) { status.error = `localStorage read failed: ${error.message || error}`; return null; } }
  function localSet(key, value) { try { localStorage.setItem(key, value); return true; } catch (error) { status.error = `localStorage write failed: ${error.message || error}`; return false; } }
  function dateValue(state) { return Date.parse(state?.meta?.updatedAt || state?.meta?.createdAt || '') || 0; }

  function dayHasUserData(day) {
    if (!day || typeof day !== 'object') return false;
    const mealStatuses = Object.values(day.meals?.statuses || {});
    const mealNotes = Object.values(day.meals?.notes || {});
    const mealSwaps = Object.values(day.meals?.swaps || {});
    const routineDone = Object.values(day.routine?.completedIds || {}).some(Boolean);
    return mealStatuses.some(Boolean) || mealNotes.some(Boolean) || mealSwaps.some(Boolean) ||
      (Array.isArray(day.meals?.customItems) && day.meals.customItems.length > 0) ||
      Boolean(day.exercise?.status || day.exercise?.minutes || day.exercise?.notes || day.exercise?.pain || day.exercise?.soreness) ||
      Boolean(day.checkin?.energy || day.checkin?.mood || day.checkin?.sleep || day.checkin?.stress || day.checkin?.hunger || day.checkin?.notes || Number(day.checkin?.water || 0) > 0) ||
      Boolean(day.windDown?.completed || day.windDown?.calmMinutes || day.windDown?.note) || routineDone || Boolean(day.weight || day.dailyNote);
  }
  function stateHasUserData(state) { if (!state || typeof state !== 'object') return false; const days = Object.values(state.days || {}); if (days.some(dayHasUserData)) return true; if (Array.isArray(state.foods) && state.foods.length > 14) return true; if (Array.isArray(state.savedMeals) && state.savedMeals.length > 3) return true; if (Array.isArray(state.swaps) && state.swaps.length > 4) return true; if (Array.isArray(state.workouts) && state.workouts.length > 7) return true; return Boolean(state.meta?.updatedAt); }

  function readLocalCandidate() {
    const primaryRaw = localGet(STORAGE_KEY); const primary = safeParse(primaryRaw); if (primary) return { raw: primaryRaw, parsed: primary, source: 'localStorage primary' };
    const backupRaw = localGet(STORAGE_BACKUP_KEY); const backup = safeParse(backupRaw); if (backup) return { raw: backupRaw, parsed: backup, source: 'localStorage backup' };
    for (const key of LEGACY_KEYS) { const legacyRaw = localGet(key); const legacy = safeParse(legacyRaw); if (legacy) return { raw: legacyRaw, parsed: legacy, source: `legacy ${key}` }; }
    return null;
  }

  function openPathfinderDb() { return new Promise((resolve, reject) => { if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable')); const request = indexedDB.open(IDB_DB_NAME, 1); request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains(IDB_STORE_NAME)) db.createObjectStore(IDB_STORE_NAME, { keyPath: 'id' }); }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error || new Error('IndexedDB open failed')); }); }
  async function readIndexedDbCandidate() { const db = await openPathfinderDb(); try { if (!db.objectStoreNames.contains(IDB_STORE_NAME)) return null; const record = await new Promise((resolve, reject) => { const tx = db.transaction(IDB_STORE_NAME, 'readonly'); const request = tx.objectStore(IDB_STORE_NAME).get(IDB_STATE_KEY); request.onsuccess = () => resolve(request.result || null); request.onerror = () => reject(request.error || new Error('IndexedDB read failed')); }); const raw = record?.payload || null; const parsed = safeParse(raw); return parsed ? { raw, parsed, source: 'IndexedDB mirror' } : null; } finally { db.close(); } }
  async function writeIndexedDbMirror(raw) { const db = await openPathfinderDb(); try { await new Promise((resolve, reject) => { const tx = db.transaction(IDB_STORE_NAME, 'readwrite'); tx.objectStore(IDB_STORE_NAME).put({ id: IDB_STATE_KEY, payload: raw, updatedAt: new Date().toISOString() }); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed')); }); return true; } finally { db.close(); } }

  function chooseBestState(localCandidate, idbCandidate) { if (!localCandidate && !idbCandidate) return null; if (!localCandidate) return idbCandidate; if (!idbCandidate) return localCandidate; const localTime = dateValue(localCandidate.parsed); const idbTime = dateValue(idbCandidate.parsed); const localHasData = stateHasUserData(localCandidate.parsed); const idbHasData = stateHasUserData(idbCandidate.parsed); if (idbHasData && !localHasData) return idbCandidate; if (localHasData && !idbHasData) return localCandidate; if (idbTime > localTime) return idbCandidate; return localCandidate; }
  function writeLocalMirrors(raw) { const primaryOk = localSet(STORAGE_KEY, raw); const backupOk = localSet(STORAGE_BACKUP_KEY, raw); return primaryOk && backupOk; }
  async function clearOldPathfinderCaches() { if (!('caches' in window)) return; try { const keys = await caches.keys(); await Promise.all(keys.filter(key => key.startsWith('pathfinder-') && key !== SERVICE_WORKER_CACHE).map(key => caches.delete(key))); } catch {} }
  function saveBootstrapStatus() { status.finishedAt = new Date().toISOString(); try { localStorage.setItem(BOOTSTRAP_STATUS_KEY, JSON.stringify(status)); } catch {} window.__PATHFINDER_BOOTSTRAP__ = { ...status }; }
  function readBootstrapStatus() { return safeParse(localGet(BOOTSTRAP_STATUS_KEY)) || status; }
  function formatDateTime(value) { if (!value) return 'Not recorded'; try { return new Date(value).toLocaleString(); } catch { return value; } }

  function summarizeStorageCandidate(label, candidate) { if (!candidate?.parsed) return { label, exists: false, updatedAt: '', days: 0, meaningfulDays: 0, bytes: 0 }; const days = Object.values(candidate.parsed.days || {}); return { label, exists: true, updatedAt: candidate.parsed.meta?.updatedAt || candidate.parsed.meta?.createdAt || '', days: days.length, meaningfulDays: days.filter(dayHasUserData).length, bytes: candidate.raw?.length || 0 }; }
  async function getStorageDiagnostics() { const primaryRaw = localGet(STORAGE_KEY); const backupRaw = localGet(STORAGE_BACKUP_KEY); let idbCandidate = null; try { idbCandidate = await readIndexedDbCandidate(); } catch {} return [summarizeStorageCandidate('Primary localStorage', { raw: primaryRaw, parsed: safeParse(primaryRaw) }), summarizeStorageCandidate('Backup localStorage', { raw: backupRaw, parsed: safeParse(backupRaw) }), summarizeStorageCandidate('IndexedDB mirror', idbCandidate)]; }
  async function repairFromBestBackup() { const localCandidate = readLocalCandidate(); let idbCandidate = null; try { idbCandidate = await readIndexedDbCandidate(); } catch {} const best = chooseBestState(localCandidate, idbCandidate); if (!best?.raw) return alert('No Pathfinder backup candidate was found.'); writeLocalMirrors(best.raw); try { await writeIndexedDbMirror(best.raw); } catch {} alert(`Repaired from ${best.source}. Pathfinder will reload now.`); location.reload(); }
  async function downloadBestBackup() { const localCandidate = readLocalCandidate(); let idbCandidate = null; try { idbCandidate = await readIndexedDbCandidate(); } catch {} const best = chooseBestState(localCandidate, idbCandidate); if (!best?.raw) return alert('No Pathfinder backup candidate was found.'); const blob = new Blob([best.raw], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `pathfinder-best-backup-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); }

  function patchCoreAppSource(source) {
    let patched = source;
    patched = patched.replace('/* Pathfinder 0.8.6', '/* Pathfinder 0.8.8 runtime patch over Pathfinder 0.8.6');
    patched = patched.replace("const APP_VERSION = '0.8.6';", "const APP_VERSION = '0.8.8';");
    const originalSaveState = `function saveState() {
  appState.data.version = APP_VERSION;
  appState.data.meta = appState.data.meta || {};
  appState.data.meta.updatedAt = new Date().toISOString();
  const payload = JSON.stringify(appState.data);`;
    const patchedSaveState = `function pathfinderDayHasUserData(day) {
  if (!day || typeof day !== 'object') return false;
  const mealStatuses = Object.values(day.meals?.statuses || {});
  const mealNotes = Object.values(day.meals?.notes || {});
  const mealSwaps = Object.values(day.meals?.swaps || {});
  const routineDone = Object.values(day.routine?.completedIds || {}).some(Boolean);
  return mealStatuses.some(Boolean) || mealNotes.some(Boolean) || mealSwaps.some(Boolean) || (Array.isArray(day.meals?.customItems) && day.meals.customItems.length > 0) || Boolean(day.exercise?.status || day.exercise?.minutes || day.exercise?.notes || day.exercise?.pain || day.exercise?.soreness) || Boolean(day.checkin?.energy || day.checkin?.mood || day.checkin?.sleep || day.checkin?.stress || day.checkin?.hunger || day.checkin?.notes || Number(day.checkin?.water || 0) > 0) || Boolean(day.windDown?.completed || day.windDown?.calmMinutes || day.windDown?.note) || routineDone || Boolean(day.weight || day.dailyNote);
}

function pruneEmptyDaysBeforeSave() {
  const days = appState.data.days || {};
  let removed = 0;
  Object.keys(days).forEach(key => {
    migrateDay(days[key]);
    if (!pathfinderDayHasUserData(days[key])) { delete days[key]; removed += 1; }
  });
  try { localStorage.setItem('pathfinder.data-safety.audit.v1', JSON.stringify({ version: APP_VERSION, removedEmptyDays: removed, checkedAt: new Date().toISOString() })); } catch {}
  return removed;
}

function saveState() {
  pruneEmptyDaysBeforeSave();
  appState.data.version = APP_VERSION;
  appState.data.meta = appState.data.meta || {};
  appState.data.meta.updatedAt = new Date().toISOString();
  const payload = JSON.stringify(appState.data);`;
    if (!patched.includes(originalSaveState)) throw new Error('0.8.8 patch could not find saveState() anchor');
    patched = patched.replace(originalSaveState, patchedSaveState);
    const originalGetDay = `function getDay(key = appState.selectedDate) {
  if (!appState.data.days[key]) {
    appState.data.days[key] = createDay(key);
    saveState();
  } else {
    migrateDay(appState.data.days[key]);
  }
  return appState.data.days[key];
}`;
    const patchedGetDay = `function getDay(key = appState.selectedDate) {
  if (!appState.data.days[key]) { appState.data.days[key] = createDay(key); }
  else { migrateDay(appState.data.days[key]); }
  return appState.data.days[key];
}

function peekDay(key = appState.selectedDate) {
  const existing = appState.data.days[key];
  if (existing) { migrateDay(existing); return existing; }
  return createDay(key);
}`;
    if (!patched.includes(originalGetDay)) throw new Error('0.8.8 patch could not find getDay() anchor');
    patched = patched.replace(originalGetDay, patchedGetDay);
    patched = patched.replace('const days = keys.map(key => ({ key, day: getDay(key) }));', 'const days = keys.map(key => ({ key, day: peekDay(key) }));');
    patched = patched.replace('const currentWeight = currentWeightForProjection(days.at(-1)?.day || getDay(endKey));', 'const currentWeight = currentWeightForProjection(days.at(-1)?.day || peekDay(endKey));');
    patched = patched.replaceAll('getDay(stats.end)', 'peekDay(stats.end)');
    patched = patched.replace('return keys.map(key => ({ key, day: getDay(key) }));', 'return keys.map(key => ({ key, day: peekDay(key) }));');
    patched += `\n\nwindow.__PATHFINDER_CORE_PATCH__ = { version: '0.8.8', appliedAt: new Date().toISOString(), changes: ['saveState prunes empty auto-created days before writing', 'getDay no longer saves immediately when creating a day', 'peekDay added for read-only weekly/history views', 'weeklyStats and historyRows use peekDay'] };\n`;
    return patched;
  }

  async function loadAppScript() { const response = await fetch(APP_SCRIPT, { cache: 'no-cache' }); if (!response.ok) throw new Error(`Unable to fetch app.js (${response.status})`); const source = await response.text(); const patchedSource = patchCoreAppSource(source); const script = document.createElement('script'); script.textContent = `${patchedSource}\n//# sourceURL=pathfinder-app-0.8.8-runtime.js`; document.body.appendChild(script); status.runtimePatched = true; }

  function injectVersionBadge() {
    const app = document.querySelector('#app'); const pageTitle = document.querySelector('#page-title')?.textContent?.trim(); if (!app || pageTitle !== 'Settings') return; if (app.querySelector('#pathfinder-version-card')) return;
    const currentStatus = readBootstrapStatus(); const card = document.createElement('div'); card.className = 'card'; card.id = 'pathfinder-version-card';
    card.innerHTML = `<div class="card-title"><div><h3>App version</h3><p>Use this to confirm you are testing the newest pushed update.</p></div><span class="badge blue">${escapeHtml(RELEASE_LABEL)}</span></div><div class="stack small-stack"><small>Bootstrap: ${escapeHtml(BOOTSTRAP_VERSION)}</small><small>Core app.js: ${escapeHtml(CORE_APP_VERSION)}</small><small>Service worker cache: ${escapeHtml(SERVICE_WORKER_CACHE)}</small><small>Runtime patch: ${escapeHtml(window.__PATHFINDER_CORE_PATCH__?.version || 'not reported')}</small><small>Loaded from: ${escapeHtml(currentStatus.loadedSource || 'unknown')}</small><small>Bootstrap finished: ${escapeHtml(formatDateTime(currentStatus.finishedAt))}</small></div><p class="note">0.8.8 patches the current app at startup so we can fix data safety before the larger 0.8.9 file split.</p>`;
    const aside = app.querySelector('aside.grid'); if (aside) aside.prepend(card); else app.prepend(card);
  }
  async function injectDataSafetyCard() {
    const app = document.querySelector('#app'); const pageTitle = document.querySelector('#page-title')?.textContent?.trim(); if (!app || pageTitle !== 'Settings') return; if (app.querySelector('#pathfinder-data-safety-card')) return;
    const diagnostics = await getStorageDiagnostics(); const audit = safeParse(localGet(SAFETY_AUDIT_KEY)) || {}; const card = document.createElement('div'); card.className = 'card'; card.id = 'pathfinder-data-safety-card';
    card.innerHTML = `<div class="card-title"><div><h3>Data safety</h3><p>Checks the storage copies Pathfinder can recover from.</p></div><span class="badge ${status.error ? 'warn' : ''}">${status.error ? 'Warning' : 'Ready'}</span></div><div class="stack small-stack">${diagnostics.map(item => `<small><strong>${escapeHtml(item.label)}:</strong> ${item.exists ? `${item.meaningfulDays}/${item.days} meaningful days · ${Math.round(item.bytes / 1024)} KB · ${escapeHtml(formatDateTime(item.updatedAt))}` : 'not found'}</small>`).join('')}<small><strong>Last empty-day prune:</strong> ${escapeHtml(formatDateTime(audit.checkedAt))} · removed ${Number(audit.removedEmptyDays || 0)}</small></div><div class="toggle-row"><button class="ghost small" data-bootstrap-action="download-best-backup">Download best backup</button><button class="ghost small" data-bootstrap-action="repair-from-best-backup">Repair from best backup</button></div><p class="note">Use Download before risky testing. Use Repair only if the app appears blank but a backup copy still exists.</p>`;
    const aside = app.querySelector('aside.grid'); if (aside) { const versionCard = app.querySelector('#pathfinder-version-card'); if (versionCard?.nextSibling) aside.insertBefore(card, versionCard.nextSibling); else aside.prepend(card); } else app.prepend(card);
  }
  function installSettingsCards() { injectVersionBadge(); injectDataSafetyCard(); const app = document.querySelector('#app'); if (app) { const observer = new MutationObserver(() => { injectVersionBadge(); injectDataSafetyCard(); }); observer.observe(app, { childList: true }); } document.addEventListener('click', event => { const action = event.target.closest('[data-bootstrap-action]'); if (action?.dataset.bootstrapAction === 'download-best-backup') return downloadBestBackup(); if (action?.dataset.bootstrapAction === 'repair-from-best-backup') return repairFromBestBackup(); setTimeout(() => { injectVersionBadge(); injectDataSafetyCard(); }, 0); }, true); document.addEventListener('change', () => setTimeout(() => { injectVersionBadge(); injectDataSafetyCard(); }, 0), true); }

  async function start() {
    setLoadingMessage('Checking localStorage backup and IndexedDB mirror before the app starts.');
    try { const localCandidate = readLocalCandidate(); let idbCandidate = null; try { idbCandidate = await readIndexedDbCandidate(); } catch (error) { status.error = `IndexedDB restore skipped: ${error.message || error}`; } const best = chooseBestState(localCandidate, idbCandidate); if (best) { status.loadedSource = best.source; if (best.source === 'IndexedDB mirror') status.restoredFromIndexedDb = writeLocalMirrors(best.raw); else if (best.source !== 'localStorage primary') status.restoredFromBackup = writeLocalMirrors(best.raw); } else status.loadedSource = 'default app state'; await clearOldPathfinderCaches(); } catch (error) { status.error = error.message || String(error); } finally { saveBootstrapStatus(); }
    setLoadingMessage(`Starting app. Restore source: ${status.loadedSource}.`);
    try { await loadAppScript(); saveBootstrapStatus(); installSettingsCards(); } catch (error) { setLoadingMessage(`Pathfinder could not load the 0.8.8 safety patch. ${error.message || error}`); throw error; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
