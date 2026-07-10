function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

class FakeRequest {
  constructor() {
    this.result = undefined;
    this.error = null;
    this.onsuccess = null;
    this.onerror = null;
    this.onupgradeneeded = null;
  }
}

class FakeObjectStoreNames {
  constructor(db) { this.db = db; }
  contains(name) { return this.db._stores.has(name); }
}

class FakeTransaction {
  constructor(db, storeNames, mode) {
    this.db = db;
    this.storeNames = Array.isArray(storeNames) ? storeNames : [storeNames];
    this.mode = mode;
    this.oncomplete = null;
    this.onerror = null;
    this.onabort = null;
    this.error = null;
    this._pending = 0;
    this._completionTimer = null;
  }

  objectStore(name) {
    if (!this.storeNames.includes(name)) throw new Error(`Store not in transaction: ${name}`);
    const store = this.db._stores.get(name);
    if (!store) throw new Error(`Missing object store: ${name}`);
    return new FakeObjectStore(this, store);
  }

  _request(operation) {
    const request = new FakeRequest();
    this._pending += 1;
    clearTimeout(this._completionTimer);
    setTimeout(() => {
      try {
        request.result = operation();
        request.onsuccess?.({ target: request });
      } catch (error) {
        request.error = error;
        this.error = error;
        request.onerror?.({ target: request });
        this.onerror?.({ target: this });
      } finally {
        this._pending -= 1;
        this._scheduleComplete();
      }
    }, 0);
    return request;
  }

  _scheduleComplete() {
    if (this._pending !== 0 || this.error) return;
    clearTimeout(this._completionTimer);
    this._completionTimer = setTimeout(() => this.oncomplete?.({ target: this }), 0);
  }
}

class FakeObjectStore {
  constructor(tx, store) {
    this.tx = tx;
    this.store = store;
  }

  put(value) {
    return this.tx._request(() => {
      const key = value?.[this.store.keyPath];
      if (key === undefined || key === null || key === '') throw new Error(`Missing keyPath ${this.store.keyPath}`);
      this.store.records.set(key, clone(value));
      return key;
    });
  }

  get(key) {
    return this.tx._request(() => clone(this.store.records.get(key)));
  }

  getAll() {
    return this.tx._request(() => [...this.store.records.values()].map(clone));
  }

  count() {
    return this.tx._request(() => this.store.records.size);
  }

  delete(key) {
    return this.tx._request(() => this.store.records.delete(key));
  }

  clear() {
    return this.tx._request(() => {
      this.store.records.clear();
      return undefined;
    });
  }
}

class FakeDatabase {
  constructor(name, version) {
    this.name = name;
    this.version = version;
    this._stores = new Map();
    this.objectStoreNames = new FakeObjectStoreNames(this);
  }

  createObjectStore(name, options = {}) {
    const store = { keyPath: options.keyPath || 'id', records: new Map() };
    this._stores.set(name, store);
    return store;
  }

  transaction(storeNames, mode = 'readonly') {
    return new FakeTransaction(this, Array.isArray(storeNames) ? storeNames : [storeNames], mode);
  }

  close() {}
}

export function installFakeIndexedDb() {
  const databases = new Map();
  globalThis.indexedDB = {
    open(name, version = 1) {
      const request = new FakeRequest();
      setTimeout(() => {
        let db = databases.get(name);
        const needsUpgrade = !db || version > db.version;
        if (!db) {
          db = new FakeDatabase(name, version);
          databases.set(name, db);
        } else if (version > db.version) {
          db.version = version;
        }
        request.result = db;
        if (needsUpgrade) request.onupgradeneeded?.({ target: request });
        request.onsuccess?.({ target: request });
      }, 0);
      return request;
    }
  };
  return databases;
}

export function installFakeLocalStorage() {
  const values = new Map();
  globalThis.localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); },
    clear() { values.clear(); }
  };
  return values;
}
