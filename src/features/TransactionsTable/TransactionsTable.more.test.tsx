import { describe, it, expect, vi, afterEach } from 'vitest';
import * as BikeSales from './BikeSalesColumns';
import { buildColDefs, getTransactionRowUrl } from './TransactionsTable.helpers';
import type { ColDef } from 'ag-grid-community';
import type { Transaction } from '../../model';

describe('TransactionsTable helpers - edge cases', () => {
    afterEach(() => vi.restoreAllMocks());

    it('getTransactionRowUrl handles missing or uppercase transaction_type gracefully', () => {
        const t1 = { transaction_id: '1' } as Partial<Transaction> as Transaction;
        expect(getTransactionRowUrl(t1)).toContain('/transaction-details/1');

        const t2 = { transaction_id: '2', transaction_type: 'RETROSPEC' } as Partial<Transaction> as Transaction;
        expect(getTransactionRowUrl(t2)).toContain('/bike-transaction/2');
    });

    it('buildColDefs returns bike sales columns when valid and not mobile', () => {
        const cols = [
            { colId: 'Bike', headerName: 'Bike' },
            { colId: 'Price', headerName: 'Price' },
        ];
        vi.spyOn(BikeSales, 'getBikeSalesColumnDefs').mockReturnValue(cols as ColDef[]);
        const result = buildColDefs('retrospec', false);
        expect(result.some((c: ColDef) => c.colId === 'Bike')).toBe(true);
        expect(result.some((c: ColDef) => c.colId === 'Price')).toBe(true);
    });

    it('buildColDefs falls back to default when bike sales columns contain invalid entries', () => {
        vi.spyOn(BikeSales, 'getBikeSalesColumnDefs').mockReturnValue([null, 0] as unknown as ColDef[]);
        const result = buildColDefs('retrospec', false);
        expect(result.some((c: ColDef) => c.colId === 'transaction_num')).toBe(true);
    });
});
