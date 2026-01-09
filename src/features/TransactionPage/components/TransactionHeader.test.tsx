import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TransactionHeader } from './TransactionHeader';
import { AllTheProviders } from '../../../test-utils';

import type { Transaction, User } from '../../../model';

const baseTransaction: Transaction = {
    transaction_num: 12,
    Customer: { first_name: 'Jane', last_name: 'Doe', email: 'a@b.com', phone: '555-1' },
} as Transaction;

const transactionWithFlags: Transaction = {
    ...baseTransaction,
    is_refurb: true,
    is_completed: false,
    is_waiting_on_email: false,
} as Transaction;

describe('TransactionHeader', () => {
    it('renders null if no customer', () => {
        const { container } = render(
            <TransactionHeader
                transactionData={{} as Transaction}
                transactionType="inpatient"
                user={null}
                onTransactionTypeChange={() => { }}
                onRetrospecStatusChange={() => { }}
                onDeleteTransaction={() => { }}
            />, { wrapper: AllTheProviders }
        );

        expect(container.innerHTML).toBe('');
    });

    it('renders customer info and buttons based on flags', async () => {
        const mockDelete = vi.fn();
        render(
            <TransactionHeader
                transactionData={baseTransaction}
                transactionType="inpatient"
                user={{ permissions: [{ name: 'createRetrospecTransaction' }] } as unknown as User}
                beerBike={true}
                refurb={true}
                isEmployee={true}
                onTransactionTypeChange={() => { }}
                onRetrospecStatusChange={() => { }}
                onDeleteTransaction={mockDelete}
            />, { wrapper: AllTheProviders }
        );

        // customer name
        expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();

        // Beer Bike button
        expect(screen.getByText('Beer Bike')).toBeInTheDocument();

        // Refurb button should not appear because transactionType is not retrospec
        expect(screen.getByText('Refurb')).toBeInTheDocument();

        // Employee badge
        expect(screen.getByText('Employee')).toBeInTheDocument();

        // Delete button exists and opens dialog (via DeleteTransactionsModal)
        const deleteBtn = screen.getByText('Delete');
        fireEvent.click(deleteBtn);

        // dialog confirm should call the handler
        const confirmBtn = await screen.findByText('Confirm');
        fireEvent.click(confirmBtn);
        await waitFor(() => expect(mockDelete).toHaveBeenCalled());
    }, 10000);

    it('renders retrospec options when retrospec and permission present', () => {
        const userWithPerm = { permissions: [{ name: 'createRetrospecTransaction' }] } as unknown as User;
        render(
            <TransactionHeader
                transactionData={baseTransaction}
                transactionType="retrospec"
                user={userWithPerm}
                beerBike={false}
                refurb={false}
                isEmployee={false}
                onTransactionTypeChange={() => { }}
                onRetrospecStatusChange={() => { }}
                onDeleteTransaction={() => { }}
            />, { wrapper: AllTheProviders }
        );

        // Second TransactionOptionDropdown will render 'Arrived' option text
        expect(screen.getByText('Arrived')).toBeInTheDocument();
    });

    it('invokes transaction type change when selecting a new option', () => {
        const onTransactionTypeChange = vi.fn();
        render(
            <TransactionHeader
                transactionData={baseTransaction}
                transactionType="inpatient"
                user={{ permissions: [] } as unknown as User}
                onTransactionTypeChange={onTransactionTypeChange}
                onRetrospecStatusChange={() => { }}
                onDeleteTransaction={() => { }}
            />, { wrapper: AllTheProviders }
        );

        fireEvent.click(screen.getByRole('button', { name: /select merge strategy/i }));
        fireEvent.click(screen.getByText('Outpatient'));

        expect(onTransactionTypeChange).toHaveBeenCalledWith('Outpatient');
    });

    it('hides Retrospec option when permission missing', () => {
        render(
            <TransactionHeader
                transactionData={baseTransaction}
                transactionType="inpatient"
                user={{ permissions: [] } as unknown as User}
                onTransactionTypeChange={() => { }}
                onRetrospecStatusChange={() => { }}
                onDeleteTransaction={() => { }}
            />, { wrapper: AllTheProviders }
        );

        fireEvent.click(screen.getByRole('button', { name: /select merge strategy/i }));
        expect(screen.queryByText('Retrospec')).not.toBeInTheDocument();
    });

    it('filters retrospec status options without safetyCheck permission', () => {
        const userNoSafety = { permissions: [{ name: 'createRetrospecTransaction' }] } as unknown as User;
        render(
            <TransactionHeader
                transactionData={transactionWithFlags}
                transactionType="retrospec"
                user={userNoSafety}
                onTransactionTypeChange={() => { }}
                onRetrospecStatusChange={() => { }}
                onDeleteTransaction={() => { }}
            />, { wrapper: AllTheProviders }
        );

        const dropdowns = screen.getAllByRole('button', { name: /select merge strategy/i });
        fireEvent.click(dropdowns[1]);
        expect(screen.queryByText('For Sale')).not.toBeInTheDocument();
    });

    it('allows selecting For Sale when safetyCheck permission present', () => {
        const onRetrospecStatusChange = vi.fn();
        const userWithSafety = {
            permissions: [
                { name: 'createRetrospecTransaction' },
                { name: 'safetyCheckBikes' },
            ],
        } as unknown as User;

        render(
            <TransactionHeader
                transactionData={transactionWithFlags}
                transactionType="retrospec"
                user={userWithSafety}
                onTransactionTypeChange={() => { }}
                onRetrospecStatusChange={onRetrospecStatusChange}
                onDeleteTransaction={() => { }}
            />, { wrapper: AllTheProviders }
        );

        const dropdowns = screen.getAllByRole('button', { name: /select merge strategy/i });
        fireEvent.click(dropdowns[1]);
        fireEvent.click(screen.getByText('For Sale'));
        expect(onRetrospecStatusChange).toHaveBeenCalledWith('For Sale');
    });
});
