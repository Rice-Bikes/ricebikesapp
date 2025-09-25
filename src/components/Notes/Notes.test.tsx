import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Notes from './Notes'
import { User } from '../../model'

// Mock DBModel
vi.mock('../../model', () => ({
    default: {
        postTransactionLog: vi.fn(),
    }
}))

// Mock queryClient
vi.mock('../../app/queryClient', () => ({
    queryClient: {
        resetQueries: vi.fn(),
    }
}))

describe('Notes Component', () => {
    const mockOnSave = vi.fn()
    const mockUser: User = {
        user_id: 'test123',
        username: 'test123',
        firstname: 'Test',
        lastname: 'User',
        active: true,
        permissions: [{
            id: 1,
            name: 'admin',
            description: 'Administrator'
        }]
    }
    const mockTransactionNum = 123

    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('renders Add Notes button when no notes exist', () => {
        render(
            <Notes
                notes=""
                onSave={mockOnSave}
                user={mockUser}
                transaction_num={123}
            />
        )

        expect(screen.getByRole('button', { name: 'Add Notes' })).toBeInTheDocument()
    })

    test('displays existing notes', () => {
        const existingNotes = 'These are existing notes'
        render(
            <Notes
                notes={existingNotes}
                onSave={mockOnSave}
                user={mockUser}
                transaction_num={mockTransactionNum}
            />
        )

        expect(screen.getByText(existingNotes)).toBeInTheDocument()
    })

    test('displays "No notes yet. Click \'Add Notes\' to get started." when notes are empty', () => {
        render(
            <Notes
                notes=""
                onSave={mockOnSave}
                user={mockUser}
                transaction_num={mockTransactionNum}
            />
        )

        expect(screen.getByText("No notes yet. Click 'Add Notes' to get started.")).toBeInTheDocument()
    })

    test('shows Edit Notes button when notes exist', () => {
        render(
            <Notes
                notes="Some existing notes"
                onSave={mockOnSave}
                user={mockUser}
                transaction_num={mockTransactionNum}
            />
        )

        expect(screen.getByRole('button', { name: 'Edit Notes' })).toBeInTheDocument()
    })

    test('enters edit mode when Add Notes button is clicked', async () => {
        render(
            <Notes
                notes=""
                onSave={mockOnSave}
                user={mockUser}
                transaction_num={mockTransactionNum}
            />
        )

        const addButton = screen.getByRole('button', { name: 'Add Notes' })
        fireEvent.click(addButton)

        await waitFor(() => {
            expect(screen.getByDisplayValue('')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Save Notes' })).toBeInTheDocument()
        })
    })

    test('updates notes text in edit mode', async () => {
        render(
            <Notes
                notes=""
                onSave={mockOnSave}
                user={mockUser}
                transaction_num={mockTransactionNum}
            />
        )

        const addButton = screen.getByRole('button', { name: 'Add Notes' })
        fireEvent.click(addButton)

        await waitFor(() => {
            const textField = screen.getByDisplayValue('')
            fireEvent.change(textField, { target: { value: 'New note content' } })
            expect(textField).toHaveValue('New note content')
        })
    })

    test('saves notes when Save button is clicked', async () => {
        render(
            <Notes
                notes=""
                onSave={mockOnSave}
                user={mockUser}
                transaction_num={mockTransactionNum}
            />
        )

        const addButton = screen.getByRole('button', { name: 'Add Notes' })
        fireEvent.click(addButton)

        await waitFor(() => {
            const textField = screen.getByDisplayValue('')
            fireEvent.change(textField, { target: { value: 'New note content' } })

            const saveButton = screen.getByRole('button', { name: 'Save Notes' })
            fireEvent.click(saveButton)
        })

        expect(mockOnSave).toHaveBeenCalledWith('New note content - Test User')
    })

    test('saves notes when Enter key is pressed (without Shift)', async () => {
        render(
            <Notes
                notes=""
                onSave={mockOnSave}
                user={mockUser}
                transaction_num={mockTransactionNum}
            />
        )

        const addButton = screen.getByRole('button', { name: 'Add Notes' })
        fireEvent.click(addButton)

        await waitFor(() => {
            const textField = screen.getByDisplayValue('')
            fireEvent.change(textField, { target: { value: 'New note content' } })
            fireEvent.keyDown(textField, { key: 'Enter', shiftKey: false })
        })

        expect(mockOnSave).toHaveBeenCalledWith('New note content - Test User')
    })

    test('does not save when Enter key is pressed with Shift', async () => {
        render(
            <Notes
                notes=""
                onSave={mockOnSave}
                user={mockUser}
                transaction_num={mockTransactionNum}
            />
        )

        const addButton = screen.getByRole('button', { name: 'Add Notes' })
        fireEvent.click(addButton)

        await waitFor(() => {
            const textField = screen.getByDisplayValue('')
            fireEvent.change(textField, { target: { value: 'New note content' } })
            fireEvent.keyDown(textField, { key: 'Enter', shiftKey: true })
        })

        expect(mockOnSave).not.toHaveBeenCalled()
    })

    test('adds newline when editing existing notes', async () => {
        const existingNotes = 'Existing notes'
        render(
            <Notes
                notes={existingNotes}
                onSave={mockOnSave}
                user={mockUser}
                transaction_num={mockTransactionNum}
            />
        )

        const editButton = screen.getByRole('button', { name: 'Edit Notes' })
        fireEvent.click(editButton)

        await waitFor(() => {
            const textField = screen.getByRole('textbox')
            expect(textField).toHaveValue('Existing notes\n')
        })
    })

    test('appends user name to notes when saving', async () => {
        render(
            <Notes
                notes=""
                onSave={mockOnSave}
                user={mockUser}
                transaction_num={mockTransactionNum}
            />
        )

        const addButton = screen.getByRole('button', { name: 'Add Notes' })
        fireEvent.click(addButton)

        await waitFor(() => {
            const textField = screen.getByDisplayValue('')
            fireEvent.change(textField, { target: { value: 'Some note' } })

            const saveButton = screen.getByRole('button', { name: 'Save Notes' })
            fireEvent.click(saveButton)
        })

        expect(mockOnSave).toHaveBeenCalledWith('Some note - Test User')
    })

    test('exits edit mode after saving', async () => {
        render(
            <Notes
                notes=""
                onSave={mockOnSave}
                user={mockUser}
                transaction_num={mockTransactionNum}
            />
        )

        const addButton = screen.getByRole('button', { name: 'Add Notes' })
        fireEvent.click(addButton)

        await waitFor(() => {
            const textField = screen.getByDisplayValue('')
            fireEvent.change(textField, { target: { value: 'New note content' } })

            const saveButton = screen.getByRole('button', { name: 'Save Notes' })
            fireEvent.click(saveButton)
        })

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Edit Notes' })).toBeInTheDocument()
            expect(screen.queryByRole('button', { name: 'Save Notes' })).not.toBeInTheDocument()
        })
    })

    test('focuses at end of text when entering edit mode', async () => {
        const existingNotes = 'Existing notes'
        render(
            <Notes
                notes={existingNotes}
                onSave={mockOnSave}
                user={mockUser}
                transaction_num={mockTransactionNum}
            />
        )

        const editButton = screen.getByRole('button', { name: 'Edit Notes' })
        fireEvent.click(editButton)

        await waitFor(() => {
            const textField = screen.getByRole('textbox') as HTMLTextAreaElement
            expect(textField.value).toBe('Existing notes\n')
            expect(textField.selectionStart).toBe(textField.value.length)
            expect(textField.selectionEnd).toBe(textField.value.length)
        })
    })
})
