import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PermissionsPage from './ManagePermissions';
import { AllTheProviders } from '../../test-utils';
import DBModel from '../../model';
import { toast } from 'react-toastify';
import { ColDef } from "ag-grid-community";

// Mock AgGrid so we don't need to register AG Grid modules in tests
vi.mock('ag-grid-react', () => ({
    AgGridReact: ({
        rowData,
        columnDefs,
    }: {
        rowData?: { id: string; name: string }[];
        columnDefs?: ColDef[];
    }) => (
        <div>
            {rowData?.map((r) => (
                <div key={r.id}>
                    <div>{r.name}</div>
                    {columnDefs
                        ?.filter((c) => c.colId === 'actions' && c.cellRenderer)
                        .map((c) => (
                            <div key={`${r.id}-actions`}>{c.cellRenderer({ data: r })}</div>
                        ))}
                </div>
            ))}
        </div>
    ),
}));

vi.mock('../../model', () => ({
    default: {
        fetchPermissions: vi.fn(),
        updatePermission: vi.fn(),
        createPermission: vi.fn(),
        deletePermission: vi.fn(),
    },
}));

vi.mock('react-toastify', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const samplePermissions = [
    { id: '1', name: 'perm1', description: 'desc1' },
    { id: '2', name: 'perm2', description: 'desc2' },
];

describe('ManagePermissions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        const model = DBModel as unknown as { fetchPermissions: vi.Mock };
        model.fetchPermissions.mockResolvedValue(samplePermissions);
    });

    it('renders and shows permissions list', async () => {
        render(<PermissionsPage />, { wrapper: AllTheProviders });

        // wait for data to be loaded and displayed inside the grid
        await waitFor(() => expect(screen.getByText('Permissions Management')).toBeInTheDocument());

        // sample permissions should be visible in the DOM (ag-grid renders content asynchronously)
        await waitFor(() => expect(screen.getByText('perm1')).toBeInTheDocument());
    });

    it('opens add permission dialog and calls createPermission', async () => {
        const model = DBModel as unknown as { createPermission: vi.Mock };
        model.createPermission.mockResolvedValue({ success: true });

        render(<PermissionsPage />, { wrapper: AllTheProviders });

        fireEvent.click(screen.getByText('Add Permission'));

        // Fill inputs after dialog renders
        fireEvent.change(await screen.findByLabelText('Permission Name'), { target: { value: 'newPerm' } });
        fireEvent.change(await screen.findByLabelText('Description'), { target: { value: 'newDesc' } });

        // Click Save
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => expect(DBModel.createPermission).toHaveBeenCalled());
    }, 10000);

    it('edits an existing permission and calls updatePermission', async () => {
        const model = DBModel as unknown as { updatePermission: vi.Mock };
        model.updatePermission.mockResolvedValue({ success: true });

        render(<PermissionsPage />, { wrapper: AllTheProviders });

        // Open edit dialog for first permission
        const editButtons = await screen.findAllByText('Edit');
        fireEvent.click(editButtons[0]);

        // Existing values should populate inputs
        const nameInput = await screen.findByLabelText('Permission Name');
        expect(nameInput).toHaveValue('perm1');

        // Change the values and save
        fireEvent.change(nameInput, { target: { value: 'perm1-updated' } });
        fireEvent.change(await screen.findByLabelText('Description'), { target: { value: 'desc1-updated' } });

        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(DBModel.updatePermission).toHaveBeenCalledWith({
                id: '1',
                name: 'perm1-updated',
                description: 'desc1-updated',
            });
            expect(toast.success).toHaveBeenCalled();
        });
    }, 10000);

    it('deletes a permission and shows toast', async () => {
        const model = DBModel as unknown as { deletePermission: vi.Mock };
        model.deletePermission.mockResolvedValue({ success: true });

        render(<PermissionsPage />, { wrapper: AllTheProviders });

        const deleteButtons = await screen.findAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(DBModel.deletePermission).toHaveBeenCalledWith('1');
            expect(toast.success).toHaveBeenCalled();
        });
    }, 10000);
});
