import { describe, it, expect, vi } from 'vitest';
import { formatCurrency, formatNumber } from '../lib/util.js';

describe('util', () => {
  describe('formatCurrency', () => {
    it('should format positive amounts in USD', () => {
      const result = formatCurrency(1234.56);
      expect(result).toBe('$1,234.56');
    });

    it('should format negative amounts in USD', () => {
      const result = formatCurrency(-999.99);
      expect(result).toBe('-$999.99');
    });

    it('should format zero', () => {
      const result = formatCurrency(0);
      expect(result).toBe('$0.00');
    });

    it('should handle large amounts', () => {
      const result = formatCurrency(1234567.89);
      expect(result).toBe('$1,234,567.89');
    });

    it('should format with different currency', () => {
      const result = formatCurrency(100, 'EUR', 'en-US');
      expect(result).toBe('€100.00');
    });

    it('should handle different locales', () => {
      const result = formatCurrency(1234.56, 'USD', 'de-DE');
      // Different Node versions may format this slightly differently
      expect(result).toMatch(/1\.234,56.*\$/);
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with default 2 decimal places', () => {
      const result = formatNumber(1234.567);
      expect(result).toBe('1,234.57');
    });

    it('should format numbers with custom decimal places', () => {
      const result = formatNumber(1234.56789, 3);
      expect(result).toBe('1,234.568');
    });

    it('should format numbers with 0 decimal places', () => {
      const result = formatNumber(1234.56, 0);
      expect(result).toBe('1,235');
    });

    it('should handle negative numbers', () => {
      const result = formatNumber(-999.99);
      expect(result).toBe('-999.99');
    });

    it('should handle zero', () => {
      const result = formatNumber(0);
      expect(result).toBe('0');
    });

    it('should handle different locales', () => {
      const result = formatNumber(1234.56, 2, 'de-DE');
      expect(result).toBe('1.234,56');
    });
  });
});
