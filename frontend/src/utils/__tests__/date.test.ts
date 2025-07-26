import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  parseDate,
  formatCalendarDate,
  formatISODate,
  DATE_FORMATS
} from '../date';

describe('Date Utilities - European Format', () => {
  describe('formatDate', () => {
    it('should format date in DD/MM/YYYY format by default', () => {
      const date = new Date('2024-03-15');
      expect(formatDate(date)).toBe('15/03/2024');
    });

    it('should format date with custom format', () => {
      const date = new Date('2024-03-15');
      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2024-03-15');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time in DD/MM/YYYY HH:mm format', () => {
      const date = new Date('2024-03-15T14:30:00');
      expect(formatDateTime(date)).toMatch(/15\/03\/2024 \d{2}:\d{2}/);
    });
  });

  describe('parseDate', () => {
    it('should parse date in DD/MM/YYYY format by default', () => {
      const dateString = '15/03/2024';
      const parsed = parseDate(dateString);
      expect(parsed.getDate()).toBe(15);
      expect(parsed.getMonth()).toBe(2); // March (0-indexed)
      expect(parsed.getFullYear()).toBe(2024);
    });

    it('should parse date with custom format', () => {
      const dateString = '2024-03-15';
      const parsed = parseDate(dateString, 'yyyy-MM-dd');
      expect(parsed.getDate()).toBe(15);
      expect(parsed.getMonth()).toBe(2); // March (0-indexed)
      expect(parsed.getFullYear()).toBe(2024);
    });
  });

  describe('formatCalendarDate', () => {
    it('should format calendar date in European style', () => {
      const date = new Date('2024-03-15');
      const formatted = formatCalendarDate(date);
      expect(formatted).toMatch(/Friday, 15 March 2024/);
    });
  });

  describe('formatISODate', () => {
    it('should format ISO string to DD/MM/YYYY by default', () => {
      const isoString = '2024-03-15T14:30:00.000Z';
      expect(formatISODate(isoString)).toBe('15/03/2024');
    });
  });

  describe('DATE_FORMATS constants', () => {
    it('should have European date formats as defaults', () => {
      expect(DATE_FORMATS.DISPLAY_DATE).toBe('dd/MM/yyyy');
      expect(DATE_FORMATS.DISPLAY_DATETIME).toBe('dd/MM/yyyy HH:mm');
      expect(DATE_FORMATS.PICKER_DATE).toBe('dd/MM/yyyy');
    });

    it('should maintain API formats as ISO standards', () => {
      expect(DATE_FORMATS.API_DATE).toBe('yyyy-MM-dd');
      expect(DATE_FORMATS.API_DATETIME).toBe("yyyy-MM-dd'T'HH:mm:ss'Z'");
    });
  });
});