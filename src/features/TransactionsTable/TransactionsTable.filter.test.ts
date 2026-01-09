import { describe, it, expect } from 'vitest';
import { passesExternalFilter, isExternalFilterPresent } from './TransactionsTable.filter';
import type { IRowNode } from 'ag-grid-community';

describe('passesExternalFilter helper', () => {
  it('returns false when there is no transaction', () => {
    const node = { data: {} } as unknown as IRowNode;
    expect(passesExternalFilter(node, 'main', '')).toBe(false);
  });

  it('returns true for unpaid retrospec transactions in retrospec view', () => {
    const node = {
      data: { Transaction: { transaction_type: 'retrospec', is_paid: false } },
    } as unknown as IRowNode;
    expect(passesExternalFilter(node, 'retrospec', '')).toBe(true);
  });

  it('returns false for paid retrospec transactions in retrospec view', () => {
    const node = {
      data: { Transaction: { transaction_type: 'retrospec', is_paid: true } },
    } as unknown as IRowNode;
    expect(passesExternalFilter(node, 'retrospec', '')).toBe(false);
  });

  it('pickup view requires completed, not paid, not refurb and older than threshold', () => {
    const oldDate = new Date(Date.now() - 184 * 24 * 60 * 60 * 1000).toISOString(); // older than 183 days
    const nodeGood = {
      data: {
        Transaction: {
          transaction_type: 'inpatient',
          is_paid: false,
          is_completed: true,
          is_refurb: false,
          date_created: oldDate,
        },
      },
    } as unknown as IRowNode;
    expect(passesExternalFilter(nodeGood, 'pickup', '')).toBe(true);

    const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const nodeRecent = {
      data: {
        Transaction: {
          transaction_type: 'inpatient',
          is_paid: false,
          is_completed: true,
          is_refurb: false,
          date_created: recentDate,
        },
      },
    } as unknown as IRowNode;
    expect(passesExternalFilter(nodeRecent, 'pickup', '')).toBe(false);
  });

  it('paid view includes paid transactions', () => {
    const node = { data: { Transaction: { is_paid: true } } } as unknown as IRowNode;
    expect(passesExternalFilter(node, 'paid', '')).toBe(true);

    const nodeNotPaid = { data: { Transaction: { is_paid: false } } } as unknown as IRowNode;
    expect(passesExternalFilter(nodeNotPaid, 'paid', '')).toBe(false);
  });

  it('completed view includes completed transactions and allows search filtering', () => {
    const node = {
      data: {
        Transaction: { transaction_id: 123, is_completed: true },
        Customer: { name: 'Jane Smith', email: 'jane@example.com', phone: '555-1234' },
      },
    } as unknown as IRowNode;

    // without search text it should include
    expect(passesExternalFilter(node, 'completed', '')).toBe(true);

    // transaction id match
    expect(passesExternalFilter(node, 'completed', '123')).toBe(true);

    // name match (case-insensitive)
    expect(passesExternalFilter(node, 'completed', 'jane')).toBe(true);

    // email match
    expect(passesExternalFilter(node, 'completed', 'example.com')).toBe(true);

    // phone match
    expect(passesExternalFilter(node, 'completed', '555')).toBe(true);

    // non-matching search should exclude
    expect(passesExternalFilter(node, 'completed', 'nomatch')).toBe(false);
  });

  it('main view includes non-retrospec incomplete transactions and retrospec refurb items', () => {
    // Non-retrospec incomplete transaction
    const nonRetro = {
      data: {
        Transaction: {
          transaction_type: 'inpatient',
          is_completed: false,
          is_employee: false,
          is_refurb: false,
        },
      },
    } as unknown as IRowNode;
    expect(passesExternalFilter(nonRetro, 'main', '')).toBe(true);

    // Retrospec refurb actively building
    const retroRefurb = {
      data: {
        Transaction: {
          transaction_type: 'retrospec',
          is_refurb: true,
          is_completed: false,
          is_waiting_on_email: false,
        },
      },
    } as unknown as IRowNode;
    expect(passesExternalFilter(retroRefurb, 'main', '')).toBe(true);
  });

  it('employee view includes employee in-progress non-beer-bike transactions', () => {
    const node = {
      data: {
        Transaction: {
          transaction_type: 'inpatient',
          is_employee: true,
          is_completed: false,
          is_beer_bike: false,
          is_refurb: false,
        },
      },
    } as unknown as IRowNode;
    expect(passesExternalFilter(node, 'employee', '')).toBe(true);
  });

  it('refurb view includes non-retrospec refurbs that are incomplete and unpaid', () => {
    const node = {
      data: {
        Transaction: {
          transaction_type: 'inpatient',
          is_refurb: true,
          is_paid: false,
          is_completed: false,
        },
      },
    } as unknown as IRowNode;
    expect(passesExternalFilter(node, 'refurb', '')).toBe(true);
  });

  it('beer bike view requires beer bike flag and older than 364 days', () => {
    const oldDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const nodeOld = {
      data: {
        Transaction: {
          is_beer_bike: true,
          date_created: oldDate,
        },
      },
    } as unknown as IRowNode;
    expect(passesExternalFilter(nodeOld, 'beer bike', '')).toBe(true);

    const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const nodeRecent = {
      data: {
        Transaction: {
          is_beer_bike: true,
          date_created: recentDate,
        },
      },
    } as unknown as IRowNode;
    expect(passesExternalFilter(nodeRecent, 'beer bike', '')).toBe(false);
  });

  it('reports that an external filter is present', () => {
    expect(isExternalFilterPresent()).toBe(true);
  });
});
