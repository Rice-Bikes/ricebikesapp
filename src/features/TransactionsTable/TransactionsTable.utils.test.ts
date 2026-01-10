import { describe, it, expect } from 'vitest';
import { isDaysLess } from './TransactionsTable.utils';

describe('TransactionsTable.utils', () => {
  it('isDaysLess returns true when difference is greater than days', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-10');
    expect(isDaysLess(5, date1, date2)).toBe(true);
  });

  it('isDaysLess returns false when difference is less than days', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-03');
    expect(isDaysLess(5, date1, date2)).toBe(false);
  });

  it('isDaysLess returns false when difference equals days', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-06');
    expect(isDaysLess(5, date1, date2)).toBe(false);
  });

  it('isDaysLess works with reversed date order', () => {
    const date1 = new Date('2024-01-10');
    const date2 = new Date('2024-01-01');
    expect(isDaysLess(5, date1, date2)).toBe(true);
  });

  it('isDaysLess returns false for zero days difference', () => {
    const date = new Date('2024-01-01');
    expect(isDaysLess(0, date, date)).toBe(false);
  });

  it('isDaysLess handles large day differences', () => {
    const date1 = new Date('2020-01-01');
    const date2 = new Date('2024-01-01');
    expect(isDaysLess(365, date1, date2)).toBe(true);
  });
});
