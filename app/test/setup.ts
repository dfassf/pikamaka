import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';

interface MemoryStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

function createMemoryStorage(): MemoryStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    clear: () => {
      map.clear();
    },
  };
}

const memoryStorage = createMemoryStorage();

Object.defineProperty(globalThis, 'localStorage', {
  value: memoryStorage,
  configurable: true,
});

beforeEach(() => {
  memoryStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  memoryStorage.clear();
});
