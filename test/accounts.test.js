import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAccountByPath, fetchAccountId } from '../lib/accounts.js';

// Mock the dependencies
vi.mock('axios');
vi.mock('../lib/config.js', () => ({
  config: {
    get: vi.fn(),
    set: vi.fn()
  },
  getOrThrow: vi.fn((key) => {
    if (key === 'apiBaseUri') return 'http://test.example.com/api';
    throw new Error(`No configuration value for ${key}`);
  })
}));
vi.mock('../lib/authentication.js', () => ({
  authToken: vi.fn(() => 'test-token')
}));

describe('accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAccountByPath', () => {
    it('should fetch account by simple path', async () => {
      const { default: http } = await import('axios');
      const mockAccount = { name: 'Checking', id: 101, quantity: 1000 };

      http.mockResolvedValue({ data: [mockAccount] });

      const result = await fetchAccountByPath('Checking', 1);

      expect(result).toEqual(mockAccount);
      expect(http).toHaveBeenCalledWith({
        url: 'http://test.example.com/api/entities/1/accounts',
        method: 'get',
        headers: {
          'Authorization': 'Bearer test-token'
        },
        params: { name: 'Checking' }
      });
    });

    it('should fetch account by nested path with colon delimiter', async () => {
      const { default: http } = await import('axios');

      const mockExpensesAccount = { name: 'Expenses', id: 200 };
      const mockGroceriesAccount = { name: 'Groceries', id: 201 };

      http
        .mockResolvedValueOnce({ data: [mockExpensesAccount] })
        .mockResolvedValueOnce({ data: [mockGroceriesAccount] });

      const result = await fetchAccountByPath('Expenses:Groceries', 1);

      expect(result).toEqual(mockGroceriesAccount);
      expect(http).toHaveBeenCalledTimes(2);
    });

    it('should fetch account by nested path with slash delimiter', async () => {
      const { default: http } = await import('axios');

      const mockAssetsAccount = { name: 'Assets', id: 300 };
      const mockBankAccount = { name: 'Bank', id: 301 };
      const mockCheckingAccount = { name: 'Checking', id: 302 };

      http
        .mockResolvedValueOnce({ data: [mockAssetsAccount] })
        .mockResolvedValueOnce({ data: [mockBankAccount] })
        .mockResolvedValueOnce({ data: [mockCheckingAccount] });

      const result = await fetchAccountByPath('Assets/Bank/Checking', 1);

      expect(result).toEqual(mockCheckingAccount);
      expect(http).toHaveBeenCalledTimes(3);
    });

    it('should throw error if account not found in path', async () => {
      const { default: http } = await import('axios');

      http.mockResolvedValue({ data: [] });

      await expect(fetchAccountByPath('Nonexistent', 1))
        .rejects.toThrow('No account found with name "Nonexistent"');
    });

    it('should throw error for empty path', async () => {
      const { default: http } = await import('axios');
      http.mockResolvedValue({ data: [] });

      await expect(fetchAccountByPath('', 1))
        .rejects.toThrow('No account found with name ""');
    });
  });

  describe('fetchAccountId', () => {
    it('should return account ID for given path', async () => {
      const { default: http } = await import('axios');
      const mockAccount = { name: 'Savings', id: 555, quantity: 5000 };

      http.mockResolvedValue({ data: [mockAccount] });

      const result = await fetchAccountId('Savings', 1);

      expect(result).toBe(555);
    });

    it('should throw error if account not found', async () => {
      const { default: http } = await import('axios');

      http.mockResolvedValue({ data: [] });

      await expect(fetchAccountId('Invalid', 1))
        .rejects.toThrow('No account found with name "Invalid"');
    });
  });
});
