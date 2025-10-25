import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrThrow } from '../lib/config.js';

// Mock configstore
vi.mock('configstore', () => {
  const mockStore = {
    apiBaseUri: 'http://test.example.com',
    currentEntityId: 12345
  };

  class MockConfigstore {
    constructor() {
      this.store = mockStore;
    }
    get(key) {
      return this.store[key];
    }
    set(key, value) {
      this.store[key] = value;
    }
    delete(key) {
      delete this.store[key];
    }
    get all() {
      return this.store;
    }
  }

  return {
    default: MockConfigstore
  };
});

describe('config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrThrow', () => {
    it('should return value when config exists', () => {
      const result = getOrThrow('apiBaseUri');
      expect(result).toBe('http://test.example.com');
    });

    it('should throw error when config does not exist', () => {
      expect(() => getOrThrow('nonexistentKey'))
        .toThrow('No configuration value for nonexistentKey');
    });

    it('should return number values', () => {
      const result = getOrThrow('currentEntityId');
      expect(result).toBe(12345);
    });
  });
});
