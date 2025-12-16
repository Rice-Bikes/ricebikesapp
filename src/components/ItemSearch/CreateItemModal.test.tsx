import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock DBModel
vi.mock('../../model', () => ({
    default: {
        activateItem: vi.fn().mockResolvedValue({ success: true }),
    },
}));

// Mock ItemPage to keep from importing heavy modal
vi.mock('../ItemPage', () => ({
    default: ({ open }: { open: boolean }) => (
        <div data-testid="item-page-modal">{open ? 'open' : 'closed'}</div>
    ),
}));

vi.mock('react-toastify', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

import { CustomNoRowsOverlay } from './CreateItemModal';
import { AllTheProviders } from '../../test-utils';
import { queryClient } from '../../app/queryClient';
import DBModel from '../../model';
import { toast } from 'react-toastify';

describe('CustomNoRowsOverlay', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders both buttons and item page modal closed initially', () => {
        render(<CustomNoRowsOverlay searchTerm="ABC-123" />, { wrapper: AllTheProviders });

        expect(screen.getByText('Check QBP for Item')).toBeInTheDocument();
        expect(screen.getByText('Add New Item')).toBeInTheDocument();
        expect(screen.getByTestId('item-page-modal')).toHaveTextContent('closed');
    });

    it('calls DBModel.activateItem when check button is clicked and shows success toast', async () => {
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        render(<CustomNoRowsOverlay searchTerm="ABC-123" />, { wrapper: AllTheProviders });

        fireEvent.click(screen.getByText('Check QBP for Item'));

        // Wait for mutation to call
        await waitFor(() => expect(DBModel.activateItem).toHaveBeenCalledWith('ABC-123'));
        // ensure queryClient.invalidateQueries was called indirectly
        await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());
        expect(toast.success).toHaveBeenCalledWith('Item activated');
    });

    it('opens modal when Add New Item is clicked', () => {
        render(<CustomNoRowsOverlay searchTerm="ABC-123" />, { wrapper: AllTheProviders });
        fireEvent.click(screen.getByText('Add New Item'));
        expect(screen.getByTestId('item-page-modal')).toHaveTextContent('open');
    });
});
