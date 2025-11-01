import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAccountByPath, fetchAccountId, buildQualifiedName, groupAndSortAccounts } from '../lib/accounts.js';

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
          'Authorization': 'Bearer test-token',
          'Accept': 'application/json'
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

  describe('buildQualifiedName', () => {
    it('returns simple name for account with no parent', () => {
      const account = { id: 1, name: 'Checking', parent: null };
      const accountsById = { 1: account };

      const result = buildQualifiedName(account, accountsById);

      expect(result).toBe('Checking');
    });

    it('returns qualified name for account with one parent', () => {
      const parentAccount = { id: 1, name: 'Assets', parent: null };
      const childAccount = { id: 2, name: 'Checking', parent: { id: 1 } };
      const accountsById = {
        1: parentAccount,
        2: childAccount
      };

      const result = buildQualifiedName(childAccount, accountsById);

      expect(result).toBe('Assets/Checking');
    });

    it('returns qualified name for account with multiple parents', () => {
      const grandparent = { id: 1, name: 'Assets', parent: null };
      const parent = { id: 2, name: 'Bank', parent: { id: 1 } };
      const child = { id: 3, name: 'Checking', parent: { id: 2 } };
      const accountsById = {
        1: grandparent,
        2: parent,
        3: child
      };

      const result = buildQualifiedName(child, accountsById);

      expect(result).toBe('Assets/Bank/Checking');
    });

    it('handles account with undefined parentId gracefully', () => {
      const account = { id: 1, name: 'Savings' };
      const accountsById = { 1: account };

      const result = buildQualifiedName(account, accountsById);

      expect(result).toBe('Savings');
    });
  });

  describe('groupAndSortAccounts', () => {
    it('groups accounts by type in correct order', () => {
      const accounts = [
        { id: 1, name: 'Groceries', type: 'expense', parent: null },
        { id: 2, name: 'Checking', type: 'asset', parent: null },
        { id: 3, name: 'Salary', type: 'income', parent: null },
        { id: 4, name: 'Credit Card', type: 'liability', parent: null },
        { id: 5, name: 'Opening Balances', type: 'equity', parent: null }
      ];

      const result = groupAndSortAccounts(accounts);

      expect(result).toHaveLength(5);
      expect(result[0].type).toBe('asset');
      expect(result[1].type).toBe('liability');
      expect(result[2].type).toBe('equity');
      expect(result[3].type).toBe('income');
      expect(result[4].type).toBe('expense');
    });

    it('sorts accounts alphabetically within each group', () => {
      const accounts = [
        { id: 1, name: 'Savings', type: 'asset', parent: null },
        { id: 2, name: 'Checking', type: 'asset', parent: null },
        { id: 3, name: 'Groceries', type: 'expense', parent: null },
        { id: 4, name: 'Utilities', type: 'expense', parent: null },
        { id: 5, name: 'Dining', type: 'expense', parent: null }
      ];

      const result = groupAndSortAccounts(accounts);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('asset');
      expect(result[0].accounts).toEqual(['Checking', 'Savings']);
      expect(result[1].type).toBe('expense');
      expect(result[1].accounts).toEqual(['Dining', 'Groceries', 'Utilities']);
    });

    it('handles accounts with qualified names', () => {
      const accounts = [
        { id: 1, name: 'Assets', type: 'asset', parent: null },
        { id: 2, name: 'Bank', type: 'asset', parent: { id: 1 } },
        { id: 3, name: 'Checking', type: 'asset', parent: { id: 2 } },
        { id: 4, name: 'Savings', type: 'asset', parent: { id: 2 } }
      ];

      const result = groupAndSortAccounts(accounts);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('asset');
      expect(result[0].accounts).toEqual([
        'Assets',
        'Assets/Bank',
        'Assets/Bank/Checking',
        'Assets/Bank/Savings'
      ]);
    });

    it('omits empty type groups', () => {
      const accounts = [
        { id: 1, name: 'Checking', type: 'asset', parent: null },
        { id: 2, name: 'Groceries', type: 'expense', parent: null }
      ];

      const result = groupAndSortAccounts(accounts);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('asset');
      expect(result[1].type).toBe('expense');
    });

    it('handles mixed case account types', () => {
      const accounts = [
        { id: 1, name: 'Checking', type: 'Asset', parent: null },
        { id: 2, name: 'Savings', type: 'ASSET', parent: null },
        { id: 3, name: 'Groceries', type: 'Expense', parent: null }
      ];

      const result = groupAndSortAccounts(accounts);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('asset');
      expect(result[0].accounts).toEqual(['Checking', 'Savings']);
      expect(result[1].type).toBe('expense');
      expect(result[1].accounts).toEqual(['Groceries']);
    });

    it('handles empty account list', () => {
      const accounts = [];

      const result = groupAndSortAccounts(accounts);

      expect(result).toEqual([]);
    });
  });
});
