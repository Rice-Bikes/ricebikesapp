import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getBikeSalesColumnDefs } from './BikeSalesColumns';
import type { ICellRendererParams } from 'ag-grid-community';
import type { Bike, Transaction } from '../../model';

describe('BikeSalesColumns cellRenderers', () => {
    it('Bike Details cellRenderer shows bike info and chips when bike present', () => {
        const cols = getBikeSalesColumnDefs();
        const bikeCol = cols.find((c) => c.headerName === 'Bike Details');
        const bike = { make: 'Trek', model: 'FX', bike_type: 'Road', size_cm: 54, condition: 'New' } as Partial<Bike> as Bike;
        const params = { data: { Bike: bike } } as ICellRendererParams;
        const el = bikeCol!.cellRenderer!(params) as unknown as JSX.Element;
        render(el);
        expect(screen.getByText(/Trek FX/)).toBeInTheDocument();
        expect(screen.getByText(/Road/)).toBeInTheDocument();
        expect(screen.getByText(/54 cm/)).toBeInTheDocument();
        expect(screen.getByText(/New/)).toBeInTheDocument();
    });

    it('Bike Details cellRenderer shows placeholder when no bike', () => {
        const cols = getBikeSalesColumnDefs();
        const bikeCol = cols.find((c) => c.headerName === 'Bike Details');
        const params = { data: {} } as ICellRendererParams;
        const el = bikeCol!.cellRenderer!(params) as unknown as JSX.Element;
        const { container } = render(el);
        expect(container.textContent).toContain('No bike assigned');
    });

    it('Price cellRenderer shows formatted price and TBD when missing', () => {
        const cols = getBikeSalesColumnDefs();
        const priceCol = cols.find((c) => c.headerName === 'Price');
        const paramsWithPrice = { data: { Bike: { price: 12.5 } } } as ICellRendererParams;
        const el1 = priceCol!.cellRenderer!(paramsWithPrice) as unknown as JSX.Element;
        const { rerender } = render(el1);
        expect(screen.getByText('$12.50')).toBeInTheDocument();

        const paramsNoPrice = { data: { Bike: { price: 0 } } } as ICellRendererParams;
        const el2 = priceCol!.cellRenderer!(paramsNoPrice) as unknown as JSX.Element;
        rerender(el2);
        expect(screen.getByText('TBD')).toBeInTheDocument();
    });

    it('Status cellRenderer shows appropriate chips for combinations', () => {
        const cols = getBikeSalesColumnDefs();
        const statusCol = cols.find((c) => c.headerName === 'Status');

        // Reserved and not completed
        const params1 = { data: { Transaction: { is_reserved: true, is_completed: false } as Partial<Transaction>, Bike: { is_available: true } } } as ICellRendererParams;
        const el1 = statusCol!.cellRenderer!(params1) as unknown as JSX.Element;
        const { rerender } = render(el1);
        expect(screen.getByText('Reserved')).toBeInTheDocument();

        // Completed and not paid
        const params2 = { data: { Transaction: { is_reserved: false, is_completed: true, is_paid: false } as Partial<Transaction>, Bike: { is_available: false } } } as ICellRendererParams;
        const el2 = statusCol!.cellRenderer!(params2) as unknown as JSX.Element;
        rerender(el2);
        expect(screen.getByText('Awaiting Payment')).toBeInTheDocument();

        // Completed and paid
        const params3 = { data: { Transaction: { is_reserved: false, is_completed: true, is_paid: true } as Partial<Transaction>, Bike: { is_available: false } } } as ICellRendererParams;
        const el3 = statusCol!.cellRenderer!(params3) as unknown as JSX.Element;
        rerender(el3);
        expect(screen.getByText('Sold')).toBeInTheDocument();

        // Available
        const params4 = { data: { Transaction: { is_reserved: false, is_completed: false } as Partial<Transaction>, Bike: { is_available: true } } } as ICellRendererParams;
        const el4 = statusCol!.cellRenderer!(params4) as unknown as JSX.Element;
        rerender(el4);
        expect(screen.getByText('Available')).toBeInTheDocument();

        // Unavailable when not available and not reserved
        const params5 = { data: { Transaction: { is_reserved: false, is_completed: false } as Partial<Transaction>, Bike: { is_available: false } } } as ICellRendererParams;
        const el5 = statusCol!.cellRenderer!(params5) as unknown as JSX.Element;
        rerender(el5);
        expect(screen.getByText('Unavailable')).toBeInTheDocument();
    });

    it('Created cellRenderer returns Today/Yesterday/days ago/date', () => {
        const cols = getBikeSalesColumnDefs();
        const createdCol = cols.find((c) => c.headerName === 'Created');

        const now = new Date();
        const todayParam = { value: now } as ICellRendererParams;
        const el1 = (createdCol!.cellRenderer!(todayParam) as unknown) as string;
        expect(el1).toBe('Today');

        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const el2 = (createdCol!.cellRenderer!({ value: yesterday } as ICellRendererParams) as unknown) as string;
        expect(el2).toBe('Yesterday');

        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const el3 = (createdCol!.cellRenderer!({ value: threeDaysAgo } as ICellRendererParams) as unknown) as string;
        expect(el3).toContain('days ago');

        const oldDate = new Date(2000, 0, 1);
        const el4 = (createdCol!.cellRenderer!({ value: oldDate } as ICellRendererParams) as unknown) as string;
        expect(el4).toBe(oldDate.toLocaleDateString());

        // missing date
        const el5 = (createdCol!.cellRenderer!({ value: null } as ICellRendererParams) as unknown) as string;
        expect(el5).toBe('');
    });
});
