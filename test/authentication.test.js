import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authToken } from '../lib/authentication.js';

// Mock the dependencies
vi.mock('netrc', () => {
  const mockNetrcData = {};
  return {
    default: vi.fn(() => mockNetrcData),
    save: vi.fn()
  };
});

vi.mock('../lib/config.js', () => ({
  config: {
    get: vi.fn()
  }
}));

describe('authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authToken', () => {
    it('should return token from netrc when available', async () => {
      const { config } = await import('../lib/config.js');
      const Netrc = (await import('netrc')).default;

      config.get.mockReturnValue('http://example.com:3000/api');

      const mockNetrcData = {
        'example.com:3000': {
          login: 'my-auth-token',
          password: 'token auth'
        }
      };

      Netrc.mockReturnValue(mockNetrcData);

      const result = authToken();

      expect(result).toBe('my-auth-token');
    });

    it('should return null when no token available and throwOnAbsence is false', async () => {
      const { config } = await import('../lib/config.js');
      const Netrc = (await import('netrc')).default;

      config.get.mockReturnValue('http://example.com:3000/api');
      Netrc.mockReturnValue({});

      const result = authToken(false);

      expect(result).toBeNull();
    });

    it('should throw error when no token available and throwOnAbsence is true', async () => {
      const { config } = await import('../lib/config.js');
      const Netrc = (await import('netrc')).default;

      config.get.mockReturnValue('http://example.com:3000/api');
      Netrc.mockReturnValue({});

      expect(() => authToken(true)).toThrow('No auth token available');
    });

    it('should return null when apiBaseUri is not configured', async () => {
      const { config } = await import('../lib/config.js');

      config.get.mockReturnValue(null);

      const result = authToken(false);

      expect(result).toBeNull();
    });

    it('should throw error when apiBaseUri is not configured and throwOnAbsence is true', async () => {
      const { config } = await import('../lib/config.js');

      config.get.mockReturnValue('');

      expect(() => authToken(true)).toThrow('No auth token available');
    });

    it('should handle different URL formats', async () => {
      const { config } = await import('../lib/config.js');
      const Netrc = (await import('netrc')).default;

      config.get.mockReturnValue('https://api.example.com/v1');

      const mockNetrcData = {
        'api.example.com': {
          login: 'token-123',
          password: 'token auth'
        }
      };

      Netrc.mockReturnValue(mockNetrcData);

      const result = authToken();

      expect(result).toBe('token-123');
    });
  });
});
