import '@testing-library/jest-dom'

// Node 25 ships an experimental global localStorage that exists but has no
// methods (warns "--localstorage-file was provided without a valid path").
// It shadows jsdom's working Storage in the vitest environment, so replace
// it with a real in-memory implementation for tests.
if (
  !globalThis.localStorage ||
  typeof globalThis.localStorage.clear !== 'function'
) {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (index) => [...store.keys()][index] ?? null,
    get length() {
      return store.size
    },
  }
}
