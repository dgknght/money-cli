import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchEntities, fetchEntityId } from '../lib/entities.js';

// Mock the dependencies
vi.mock('axios');
vi.mock('../lib/config.js', () => ({
  config: {
    get: vi.fn(),
    set: vi.fn()
  },
  getOrThrow: vi.fn((key) => {
    if (key === 'apiBaseUri') return 'http://test.example.com/api';
    if (key === 'currentEntityId') return 12345;
    throw new Error(`No configuration value for ${key}`);
  })
}));
vi.mock('../lib/authentication.js', () => ({
  authToken: vi.fn(() => 'test-token')
}));

describe('entities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchEntities', () => {
    it('fetches entities from the API', async () => {
      const { default: http } = await import('axios');
      const mockEntities = [
        { name: 'Entity 1', id: 1 },
        { name: 'Entity 2', id: 2 }
      ];

      http.mockResolvedValue({ data: mockEntities });

      const result = await fetchEntities();

      expect(result).toEqual(mockEntities);
      expect(http).toHaveBeenCalledWith({
        url: 'http://test.example.com/api/entities',
        method: 'get',
        headers: {
          'Authorization': 'Bearer test-token',
          'Accept': 'application/json'
        }
      });
    });

    it('should throw error if API call fails', async () => {
      const { default: http } = await import('axios');
      http.mockRejectedValue(new Error('Network error'));

      await expect(fetchEntities()).rejects.toThrow('Network error');
    });
  });

  describe('fetchEntityId', () => {
    it('returns currentEntityId from config when no entity name provided', async () => {
      const { getOrThrow } = await import('../lib/config.js');

      const result = await fetchEntityId(null);

      expect(result).toBe(12345);
      expect(getOrThrow).toHaveBeenCalledWith('currentEntityId');
    });

    it('fetches and returns the ID of the named entity', async () => {
      const { default: http } = await import('axios');
      const { config } = await import('../lib/config.js');

      const mockEntities = [
        { name: 'Test Entity', id: 99 },
        { name: 'Other Entity', id: 88 }
      ];

      http.mockResolvedValue({ data: mockEntities });

      const result = await fetchEntityId('Test Entity');

      expect(result).toBe(99);
      expect(config.set).toHaveBeenCalledWith('currentEntityId', 99);
    });

    it('throws an error if entity not found by name', async () => {
      const { default: http } = await import('axios');

      const mockEntities = [
        { name: 'Test Entity', id: 99 }
      ];

      http.mockResolvedValue({ data: mockEntities });

      await expect(fetchEntityId('Nonexistent Entity'))
        .rejects.toThrow('No entity found with name "Nonexistent Entity"');
    });
  });
});
