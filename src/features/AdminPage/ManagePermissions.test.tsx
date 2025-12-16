import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PermissionsPage from './ManagePermissions';
import { AllTheProviders } from '../../test-utils';
import DBModel from '../../model';

// Mock AgGrid so we don't need to register AG Grid modules in tests
vi.mock('ag-grid-react', () => ({
    AgGridReact: ({ rowData }: { rowData?: { id: string; name: string }[] }) => (
        <div>
            {rowData?.map((r) => (
                <div key={r.id}>{r.name}</div>
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

        // Fill inputs
        fireEvent.change(screen.getByLabelText('Permission Name'), { target: { value: 'newPerm' } });
        fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'newDesc' } });

        // Click Save
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => expect(DBModel.createPermission).toHaveBeenCalled());
    });
});
