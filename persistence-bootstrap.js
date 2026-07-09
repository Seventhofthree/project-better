(() => {
  const RELEASE_LABEL = '0.9.2 Exercise/Routine Polish';
  const APP_SCRIPT = './app.js?v=0.9.2';

  window.__PATHFINDER_RELEASE__ = {
    release: RELEASE_LABEL,
    bootstrapVersion: 'removed/inert fallback',
    coreAppVersion: '0.9.2',
    serviceWorkerCache: 'pathfinder-0.9.2'
  };

  function setLoadingMessage(message) {
    const app = document.querySelector('#app');
    if (!app) return;
    app.innerHTML = `<section class="card highlight"><h2>Loading Pathfinder…</h2><p>${message}</p></section>`;
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

  async function clearOldCaches() {
    if (!('caches' in window)) return;
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.startsWith('pathfinder-') && key !== 'pathfinder-0.9.2').map(key => caches.delete(key)));
    } catch {}
  }

  async function start() {
    setLoadingMessage('Starting app directly. Old bootstrap restore is disabled.');
    await clearOldCaches();
    await loadAppScriptNormally();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
