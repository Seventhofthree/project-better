(() => {
  const BOOTSTRAP_VERSION = '0.8.7';
  const STORAGE_KEY = 'pathfinder.state.v8';
  const STORAGE_BACKUP_KEY = 'pathfinder.state.v8.backup';
  const LEGACY_KEYS = ['pathfinder.state.v8.backup', 'pathfinder.state.v7', 'pathfinder.state.v1', 'pathfinder.0.1.state'];
  const IDB_DB_NAME = 'pathfinder-local-state';
  const IDB_STORE_NAME = 'state';
  const IDB_STATE_KEY = 'main';
  const APP_SCRIPT = './app.js?v=0.8.7';
  const BOOTSTRAP_STATUS_KEY = 'pathfinder.bootstrap.status.v1';

  const status = {
    version: BOOTSTRAP_VERSION,
    startedAt: new Date().toISOString(),
    loadedSource: 'unknown',
    restoredFromIndexedDb: false,
    restoredFromBackup: false,
    error: ''
  };

  function setLoadingMessage(message) {
    const app = document.querySelector('#app');
    if (!app) return;

    app.innerHTML = `
      <section class="card highlight">
        <h2>Loading Pathfinder…</h2>
        <p>${escapeHtml(message)}</p>
      </section>
    `;
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
      Array.isArray(day.meals?.customItems) && day.meals.customItems.length > 0 ||
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

    if (primary) {
      return { raw: primaryRaw, parsed: primary, source: 'localStorage primary' };
    }

    const backupRaw = localGet(STORAGE_BACKUP_KEY);
    const backup = safeParse(backupRaw);

    if (backup) {
      return { raw: backupRaw, parsed: backup, source: 'localStorage backup' };
    }

    for (const key of LEGACY_KEYS) {
      const legacyRaw = localGet(key);
      const legacy = safeParse(legacyRaw);

      if (legacy) {
        return { raw: legacyRaw, parsed: legacy, source: `legacy ${key}` };
      }
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
          .filter(key => key.startsWith('pathfinder-') && key !== 'pathfinder-0.8.7')
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

  function loadAppScript() {
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
      await loadAppScript();
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
