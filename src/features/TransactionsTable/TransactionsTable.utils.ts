// Small utilities for TransactionsTable that are not React components
export function isDaysLess(days: number, a: Date, b: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor(Math.abs(b.getTime() - a.getTime()) / msPerDay);
  return diffDays > days;
}
