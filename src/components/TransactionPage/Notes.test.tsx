import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Notes from './Notes';

// Mock DBModel
vi.mock('../../model', () => ({
    default: {
        postTransactionLog: vi.fn(),
    },
}));

// Mock UserContext hooks (allow modifying mockUser at runtime)
const mockLogout = vi.fn();
const mockUser: { data?: { user_id: string; firstname: string; lastname: string; } } = { data: { user_id: 'u1', firstname: 'Jane', lastname: 'Doe' } };
vi.mock('../../contexts/UserContext', () => ({
    useUser: () => mockUser,
    useAuth: () => ({ logout: mockLogout }),
}));

// Mock react-toastify so it doesn't actually show toasts during tests
vi.mock('react-toastify', () => ({
    toast: {
        error: vi.fn(),
    },
}));

import DBModel from '../../model';
import { toast } from 'react-toastify';

describe('Notes component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders and shows Add Notes when empty', () => {
        const onSave = vi.fn();
        render(<Notes notes="" onSave={onSave} transaction_num={1} />);

        expect(screen.getByText("Add Notes")).toBeInTheDocument();
        expect(screen.getByText("No notes yet. Click 'Add Notes' to get started.")).toBeInTheDocument();
    });

    it('opens textarea and calls logout when clicking Add Notes', () => {
        const onSave = vi.fn();
        // mockLogout is provided by the mocked module above
        render(<Notes notes="" onSave={onSave} transaction_num={2} />);

        fireEvent.click(screen.getByText('Add Notes'));

        expect(mockLogout).toHaveBeenCalled();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('saves notes and calls DBModel.postTransactionLog and onSave when user exists', () => {
        const onSave = vi.fn();
        render(<Notes notes="initial" onSave={onSave} transaction_num={3} />);

        // Open edit
        fireEvent.click(screen.getByText('Edit Notes'));

        const textbox = screen.getByRole('textbox') as HTMLTextAreaElement;
        // change text
        fireEvent.change(textbox, { target: { value: 'updated note' } });

        // Click save
        fireEvent.click(screen.getByText('Save Notes'));

        // onSave should be called with appended user name
        expect(onSave).toHaveBeenCalledWith('updated note - Jane Doe');

        // DBModel.postTransactionLog should be called (we don't assert exact diff string here)
        expect(DBModel.postTransactionLog).toHaveBeenCalledWith(
            3,
            'u1',
            expect.any(String),
            'updated',
        );
    });

    it('shows error toast and does not call onSave when user not found', () => {
        // Set the mock to represent a missing user
        mockUser.data = undefined;
        const onSave = vi.fn();
        render(<Notes notes="start" onSave={onSave} transaction_num={4} />);

        fireEvent.click(screen.getByText('Edit Notes'));

        const textbox = screen.getByRole('textbox') as HTMLTextAreaElement;
        fireEvent.change(textbox, { target: { value: 'changed' } });

        fireEvent.click(screen.getByText('Save Notes'));

        expect(toast.error).toHaveBeenCalledWith('User not found. Cannot save notes.');
        expect(onSave).not.toHaveBeenCalled();
        // restore mock user so other tests are unaffected
        mockUser.data = { user_id: 'u1', firstname: 'Jane', lastname: 'Doe' };
    });
});
