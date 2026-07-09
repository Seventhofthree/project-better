(() => {
  const BOOTSTRAP_VERSION = '0.8.8.1';
  const RELEASE_LABEL = '0.8.8.1 Save Reliability Fix';
  const CORE_APP_VERSION = '0.8.6 core loaded normally';
  const SERVICE_WORKER_CACHE = 'pathfinder-0.8.8.1';
  const STORAGE_KEY = 'pathfinder.state.v8';
  const STORAGE_BACKUP_KEY = 'pathfinder.state.v8.backup';
  const LEGACY_KEYS = ['pathfinder.state.v8.backup', 'pathfinder.state.v7', 'pathfinder.state.v1', 'pathfinder.0.1.state'];
  const IDB_DB_NAME = 'pathfinder-local-state';
  const IDB_STORE_NAME = 'state';
  const IDB_STATE_KEY = 'main';
  const APP_SCRIPT = './app.js?v=0.8.8.1';
  const BOOTSTRAP_STATUS_KEY = 'pathfinder.bootstrap.status.v1';

  const status = {
    version: BOOTSTRAP_VERSION,
    release: RELEASE_LABEL,
    coreAppVersion: CORE_APP_VERSION,
    serviceWorkerCache: SERVICE_WORKER_CACHE,
    startedAt: new Date().toISOString(),
    loadedSource: 'unknown',
    restoredFromIndexedDb: false,
    restoredFromBackup: false,
    runtimePatched: false,
    error: ''
  };

  window.__PATHFINDER_RELEASE__ = {
    release: RELEASE_LABEL,
    bootstrapVersion: BOOTSTRAP_VERSION,
    coreAppVersion: CORE_APP_VERSION,
    serviceWorkerCache: SERVICE_WORKER_CACHE
  };

  function setLoadingMessage(message) {
    const app = document.querySelector('#app');
    if (!app) return;
    app.innerHTML = `<section class="card highlight"><h2>Loading Pathfinder…</h2><p>${escapeHtml(message)}</p></section>`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[char]));
  }

  function safeParse(raw) {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  function localGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      status.error = `localStorage read failed: ${error.message || error}`;
      return null;
    }
  }

  function localSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      status.error = `localStorage write failed: ${error.message || error}`;
      return false;
    }
  }

  function dateValue(state) {
    return Date.parse(state?.meta?.updatedAt || state?.meta?.createdAt || '') || 0;
  }

  function dayHasUserData(day) {
    if (!day || typeof day !== 'object') return false;

    const mealStatuses = Object.values(day.meals?.statuses || {});
    const mealNotes = Object.values(day.meals?.notes || {});
    const mealSwaps = Object.values(day.meals?.swaps || {});
    const routineDone = Object.values(day.routine?.completedIds || {}).some(Boolean);

    return (
      mealStatuses.some(Boolean) ||
      mealNotes.some(Boolean) ||
      mealSwaps.some(Boolean) ||
      (Array.isArray(day.meals?.customItems) && day.meals.customItems.length > 0) ||
      Boolean(day.exercise?.status || day.exercise?.minutes || day.exercise?.notes || day.exercise?.pain || day.exercise?.soreness) ||
      Boolean(day.checkin?.energy || day.checkin?.mood || day.checkin?.sleep || day.checkin?.stress || day.checkin?.hunger || day.checkin?.notes || Number(day.checkin?.water || 0) > 0) ||
      Boolean(day.windDown?.completed || day.windDown?.calmMinutes || day.windDown?.note) ||
      routineDone ||
      Boolean(day.weight || day.dailyNote)
    );
  }

  function stateHasUserData(state) {
    if (!state || typeof state !== 'object') return false;

    const days = Object.values(state.days || {});
    if (days.some(dayHasUserData)) return true;

    if (Array.isArray(state.foods) && state.foods.length > 14) return true;
    if (Array.isArray(state.savedMeals) && state.savedMeals.length > 3) return true;
    if (Array.isArray(state.swaps) && state.swaps.length > 4) return true;
    if (Array.isArray(state.workouts) && state.workouts.length > 7) return true;

    return Boolean(state.meta?.updatedAt);
  }

  function readLocalCandidate() {
    const primaryRaw = localGet(STORAGE_KEY);
    const primary = safeParse(primaryRaw);

    if (primary) return { raw: primaryRaw, parsed: primary, source: 'localStorage primary' };

    const backupRaw = localGet(STORAGE_BACKUP_KEY);
    const backup = safeParse(backupRaw);

    if (backup) return { raw: backupRaw, parsed: backup, source: 'localStorage backup' };

    for (const key of LEGACY_KEYS) {
      const legacyRaw = localGet(key);
      const legacy = safeParse(legacyRaw);

      if (legacy) return { raw: legacyRaw, parsed: legacy, source: `legacy ${key}` };
    }

    return null;
  }

  function openPathfinderDb() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB unavailable'));
        return;
      }

      const request = indexedDB.open(IDB_DB_NAME, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
    });
  }

  async function readIndexedDbCandidate() {
    const db = await openPathfinderDb();

    try {
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) return null;

      const record = await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE_NAME, 'readonly');
        const request = tx.objectStore(IDB_STORE_NAME).get(IDB_STATE_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error('IndexedDB read failed'));
      });

      const raw = record?.payload || null;
      const parsed = safeParse(raw);
      return parsed ? { raw, parsed, source: 'IndexedDB mirror' } : null;
    } finally {
      db.close();
    }
  }

  async function writeIndexedDbMirror(raw) {
    const db = await openPathfinderDb();

    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
        tx.objectStore(IDB_STORE_NAME).put({ id: IDB_STATE_KEY, payload: raw, updatedAt: new Date().toISOString() });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));
      });
      return true;
    } finally {
      db.close();
    }
  }

  function chooseBestState(localCandidate, idbCandidate) {
    if (!localCandidate && !idbCandidate) return null;
    if (!localCandidate) return idbCandidate;
    if (!idbCandidate) return localCandidate;

    const localTime = dateValue(localCandidate.parsed);
    const idbTime = dateValue(idbCandidate.parsed);
    const localHasData = stateHasUserData(localCandidate.parsed);
    const idbHasData = stateHasUserData(idbCandidate.parsed);

    if (idbHasData && !localHasData) return idbCandidate;
    if (localHasData && !idbHasData) return localCandidate;
    if (idbTime > localTime) return idbCandidate;

    return localCandidate;
  }

  function writeLocalMirrors(raw) {
    const primaryOk = localSet(STORAGE_KEY, raw);
    const backupOk = localSet(STORAGE_BACKUP_KEY, raw);
    return primaryOk && backupOk;
  }

  async function clearOldPathfinderCaches() {
    if (!('caches' in window)) return;

    try {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(key => key.startsWith('pathfinder-') && key !== SERVICE_WORKER_CACHE)
          .map(key => caches.delete(key))
      );
    } catch {
      // Cache cleanup is helpful, not required.
    }
  }

  function saveBootstrapStatus() {
    status.finishedAt = new Date().toISOString();
    try {
      window.localStorage.setItem(BOOTSTRAP_STATUS_KEY, JSON.stringify(status));
    } catch {
      // Ignore; the main app still has its own storage warning.
    }
    window.__PATHFINDER_BOOTSTRAP__ = { ...status };
  }

  function readBootstrapStatus() {
    const stored = safeParse(localGet(BOOTSTRAP_STATUS_KEY));
    return stored || status;
  }

  function formatDateTime(value) {
    if (!value) return 'Not recorded';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  function summarizeStorageCandidate(label, candidate) {
    if (!candidate?.parsed) {
      return { label, exists: false, updatedAt: '', days: 0, meaningfulDays: 0, bytes: 0 };
    }

    const days = Object.values(candidate.parsed.days || {});
    return {
      label,
      exists: true,
      updatedAt: candidate.parsed.meta?.updatedAt || candidate.parsed.meta?.createdAt || '',
      days: days.length,
      meaningfulDays: days.filter(dayHasUserData).length,
      bytes: candidate.raw?.length || 0
    };
  }

  async function getStorageDiagnostics() {
    const primaryRaw = localGet(STORAGE_KEY);
    const backupRaw = localGet(STORAGE_BACKUP_KEY);
    let idbCandidate = null;

    try {
      idbCandidate = await readIndexedDbCandidate();
    } catch {
      idbCandidate = null;
    }

    return [
      summarizeStorageCandidate('Primary localStorage', { raw: primaryRaw, parsed: safeParse(primaryRaw) }),
      summarizeStorageCandidate('Backup localStorage', { raw: backupRaw, parsed: safeParse(backupRaw) }),
      summarizeStorageCandidate('IndexedDB mirror', idbCandidate)
    ];
  }

  async function repairFromBestBackup() {
    const localCandidate = readLocalCandidate();
    let idbCandidate = null;

    try {
      idbCandidate = await readIndexedDbCandidate();
    } catch {
      idbCandidate = null;
    }

    const best = chooseBestState(localCandidate, idbCandidate);
    if (!best?.raw) {
      window.alert('No Pathfinder backup candidate was found.');
      return;
    }

    writeLocalMirrors(best.raw);
    try {
      await writeIndexedDbMirror(best.raw);
    } catch {
      // Local repair still matters if IndexedDB write fails.
    }

    window.alert(`Repaired from ${best.source}. Pathfinder will reload now.`);
    window.location.reload();
  }

  async function downloadBestBackup() {
    const localCandidate = readLocalCandidate();
    let idbCandidate = null;

    try {
      idbCandidate = await readIndexedDbCandidate();
    } catch {
      idbCandidate = null;
    }

    const best = chooseBestState(localCandidate, idbCandidate);
    if (!best?.raw) {
      window.alert('No Pathfinder backup candidate was found.');
      return;
    }

    const blob = new Blob([best.raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pathfinder-best-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function injectVersionBadge() {
    const app = document.querySelector('#app');
    const pageTitle = document.querySelector('#page-title')?.textContent?.trim();

    if (!app || pageTitle !== 'Settings') return;
    if (app.querySelector('#pathfinder-version-card')) return;

    const currentStatus = readBootstrapStatus();
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'pathfinder-version-card';
    card.innerHTML = `
      <div class="card-title">
        <div>
          <h3>App version</h3>
          <p>Use this to confirm you are testing the newest pushed update.</p>
        </div>
        <span class="badge blue">${escapeHtml(RELEASE_LABEL)}</span>
      </div>
      <div class="stack small-stack">
        <small>Bootstrap: ${escapeHtml(BOOTSTRAP_VERSION)}</small>
        <small>Core app.js: ${escapeHtml(CORE_APP_VERSION)}</small>
        <small>Service worker cache: ${escapeHtml(SERVICE_WORKER_CACHE)}</small>
        <small>Runtime patch: removed</small>
        <small>Loaded from: ${escapeHtml(currentStatus.loadedSource || 'unknown')}</small>
        <small>Bootstrap finished: ${escapeHtml(formatDateTime(currentStatus.finishedAt))}</small>
      </div>
      <p class="note">0.8.8.1 removes the 0.8.8 runtime patch and loads the core app normally to restore reliable saving.</p>
    `;

    const aside = app.querySelector('aside.grid');
    if (aside) aside.prepend(card);
    else app.prepend(card);
  }

  async function injectDataSafetyCard() {
    const app = document.querySelector('#app');
    const pageTitle = document.querySelector('#page-title')?.textContent?.trim();

    if (!app || pageTitle !== 'Settings') return;
    if (app.querySelector('#pathfinder-data-safety-card')) return;

    const diagnostics = await getStorageDiagnostics();
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'pathfinder-data-safety-card';
    card.innerHTML = `
      <div class="card-title">
        <div>
          <h3>Data safety</h3>
          <p>Checks the storage copies Pathfinder can recover from.</p>
        </div>
        <span class="badge ${status.error ? 'warn' : ''}">${status.error ? 'Warning' : 'Ready'}</span>
      </div>
      <div class="stack small-stack">
        ${diagnostics.map(item => `
          <small>
            <strong>${escapeHtml(item.label)}:</strong>
            ${item.exists ? `${item.meaningfulDays}/${item.days} meaningful days · ${Math.round(item.bytes / 1024)} KB · ${escapeHtml(formatDateTime(item.updatedAt))}` : 'not found'}
          </small>
        `).join('')}
      </div>
      <div class="toggle-row">
        <button class="ghost small" data-bootstrap-action="download-best-backup">Download best backup</button>
        <button class="ghost small" data-bootstrap-action="repair-from-best-backup">Repair from best backup</button>
      </div>
      <p class="note">Use Download before risky testing. Use Repair only if the app appears blank but a backup copy still exists.</p>
    `;

    const aside = app.querySelector('aside.grid');
    if (aside) {
      const versionCard = app.querySelector('#pathfinder-version-card');
      if (versionCard?.nextSibling) aside.insertBefore(card, versionCard.nextSibling);
      else aside.prepend(card);
    } else {
      app.prepend(card);
    }
  }

  function installSettingsCards() {
    injectVersionBadge();
    injectDataSafetyCard();

    const app = document.querySelector('#app');
    if (app) {
      const observer = new MutationObserver(() => {
        injectVersionBadge();
        injectDataSafetyCard();
      });
      observer.observe(app, { childList: true });
    }

    document.addEventListener('click', event => {
      const action = event.target.closest('[data-bootstrap-action]');
      if (action?.dataset.bootstrapAction === 'download-best-backup') {
        downloadBestBackup();
        return;
      }
      if (action?.dataset.bootstrapAction === 'repair-from-best-backup') {
        repairFromBestBackup();
        return;
      }
      window.setTimeout(() => {
        injectVersionBadge();
        injectDataSafetyCard();
      }, 0);
    }, true);

    document.addEventListener('change', () => {
      window.setTimeout(() => {
        injectVersionBadge();
        injectDataSafetyCard();
      }, 0);
    }, true);
  }

  function loadAppScriptNormally() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = APP_SCRIPT;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Unable to load app.js'));
      document.body.appendChild(script);
    });
  }

  async function start() {
    setLoadingMessage('Checking localStorage backup and IndexedDB mirror before the app starts.');

    try {
      const localCandidate = readLocalCandidate();
      let idbCandidate = null;

      try {
        idbCandidate = await readIndexedDbCandidate();
      } catch (error) {
        status.error = `IndexedDB restore skipped: ${error.message || error}`;
      }

      const best = chooseBestState(localCandidate, idbCandidate);

      if (best) {
        status.loadedSource = best.source;

        if (best.source === 'IndexedDB mirror') {
          const wrote = writeLocalMirrors(best.raw);
          status.restoredFromIndexedDb = wrote;
        } else if (best.source !== 'localStorage primary') {
          const wrote = writeLocalMirrors(best.raw);
          status.restoredFromBackup = wrote;
        }
      } else {
        status.loadedSource = 'default app state';
      }

      await clearOldPathfinderCaches();
    } catch (error) {
      status.error = error.message || String(error);
    } finally {
      saveBootstrapStatus();
    }

    setLoadingMessage(`Starting app. Restore source: ${status.loadedSource}.`);

    try {
      await loadAppScriptNormally();
      saveBootstrapStatus();
      installSettingsCards();
    } catch (error) {
      setLoadingMessage(`Pathfinder could not load app.js. ${error.message || error}`);
      throw error;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
