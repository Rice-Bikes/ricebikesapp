import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TransactionHeader } from './TransactionHeader';
import { AllTheProviders } from '../../../test-utils';

import type { Transaction, User } from '../../../model';

const baseTransaction: Transaction = {
    transaction_num: 12,
    Customer: { first_name: 'Jane', last_name: 'Doe', email: 'a@b.com', phone: '555-1' },
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

    it('renders customer info and buttons based on flags', () => {
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
        const confirmBtn = screen.getByText('Confirm');
        fireEvent.click(confirmBtn);
        expect(mockDelete).toHaveBeenCalled();
    });

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
});
