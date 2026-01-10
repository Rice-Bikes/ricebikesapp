import { describe, it, expect, vi } from 'vitest';
import {
  convertStringDecimalsToNumbers,
  convertResponseDecimals,
  convertBikeDecimals,
  fetchWithDecimalConversion,
} from './decimalConverter';

describe('decimal converter utilities', () => {
  it('convertStringDecimalsToNumbers converts numeric strings recursively', () => {
    const input = {
      price: '12.34',
      nested: { amount: '5', list: ['1', 'not-number', '  3.5  '] },
      empty: '',
      notNumeric: 'abc',
      nullVal: null,
    };

    type OutType = { price: number; nested: { amount: number; list: (number | string)[] }; empty: string; notNumeric: string; nullVal: null };
    const out = convertStringDecimalsToNumbers(input) as OutType;

    expect(out.price).toBe(12.34);
    expect(out.nested.amount).toBe(5);
    expect(out.nested.list[0]).toBe(1);
    expect(out.nested.list[1]).toBe('not-number');
    expect(out.nested.list[2]).toBe(3.5);
    expect(out.empty).toBe('');
    expect(out.notNumeric).toBe('abc');
    expect(out.nullVal).toBeNull();
  });

  it('convertResponseDecimals only converts specified fields', () => {
    const data = {
      price: '10.00',
      amount: '2.5',
      name: 'widget',
      nested: { subtotal: '7.5', ignored: 'x' },
    };

    type RespType = { price: number; amount: number; name: string; nested: { subtotal: number; ignored: string } };
    const out = convertResponseDecimals(data) as RespType;
    expect(out.price).toBe(10);
    expect(out.amount).toBe(2.5);
    expect(out.nested.subtotal).toBe(7.5);
    expect(out.name).toBe('widget');
  });

  it('convertBikeDecimals converts bike-specific fields', () => {
    const bike = { price: '100.5', size_cm: '120', weight_kg: '13.2', other: 'abc' };
    type BikeType = { price: number; size_cm: number; weight_kg: number; other: string };
    const out = convertBikeDecimals(bike) as BikeType;
    expect(out.price).toBe(100.5);
    expect(out.size_cm).toBe(120);
    expect(out.weight_kg).toBe(13.2);
    expect(out.other).toBe('abc');
  });

  it('fetchWithDecimalConversion returns converted response when JSON', async () => {
    // Mock fetch to return JSON response
    const fakeData = { price: '2.5', amount: '3.5' };
    const fakeResponse = {
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => fakeData,
      clone() {
        return this;
      },
    } as unknown as Response;

    const mockedFetch = vi.fn().mockResolvedValue(fakeResponse);
    global.fetch = mockedFetch as unknown as typeof global.fetch;

    const res = await fetchWithDecimalConversion('http://example.test');
    const json = await res.json();
    expect(json.price).toBe(2.5);
    expect(json.amount).toBe(3.5);
  });
});
