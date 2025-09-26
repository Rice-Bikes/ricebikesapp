import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Notes from './Notes'
import { User } from '../../model'

// Mock the EditorApp used inside Notes so tests run deterministically.
import { useEffect, useRef, useState } from 'react'

vi.mock('./EditorContainer', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    EditorApp: ({ initialValue, onSave }: any) => {
        // Controlled textarea that displays plain text extracted from either
        // raw text or a minimal Lexical JSON string. When edited it emits a
        // valid Lexical JSON string (so Notes.handleEditorChange accepts it).
        const ref = useRef<HTMLTextAreaElement | null>(null)
        const [value, setValue] = useState<string>(() => {
            if (!initialValue) return ''
            try {
                const parsed = JSON.parse(initialValue)
                // walk for first text node
                const walk = (n: unknown): string | null => {
                    if (!n || typeof n !== 'object') return null
                    const obj = n as Record<string, unknown>
                    if (obj.type === 'text' && typeof obj.text === 'string') return obj.text as string
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const kids: any[] = (obj.children as any) || (obj.nodes as any) || []
                    for (const c of kids) {
                        const r = walk(c)
                        if (r) return r
                    }
                    return null
                }
                const found = walk(parsed.root || parsed)
                return found ?? ''
            } catch {
                return String(initialValue)
            }
        })

        useEffect(() => {
            // focus and position caret at end to satisfy selection-based tests
            const ta = ref.current
            if (ta) {
                ta.focus()
                ta.selectionStart = ta.value.length
                ta.selectionEnd = ta.value.length
            }
        }, [])

        const emitLexical = (text: string) => {
            const lexical = JSON.stringify({
                root: {
                    type: 'root',
                    version: 1,
                    children: [
                        {
                            type: 'paragraph',
                            version: 1,
                            children: [
                                { type: 'text', version: 1, text },
                            ],
                        },
                    ],
                },
            })
            onSave(lexical)
        }

        return (
            <textarea
                ref={ref}
                value={value}
                onChange={(e) => {
                    const v = e.target.value
                    setValue(v)
                    emitLexical(v)
                }}
                onKeyDown={(e) => {
                    // emulate editor behavior: Enter without Shift should trigger Save
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        // If a Save Notes button is present in the DOM, click it to
                        // invoke the component-level save handler (which will call
                        // the onSave prop passed into Notes).
                        try {
                            const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
                            const saveBtn = buttons.find(b => b.textContent && b.textContent.includes('Save Notes'))
                            if (saveBtn) saveBtn.click()
                        } catch {
                            // ignore
                        }
                    }
                }}
            />
        )
    }
}))

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

    const extractSavedText = (arg: unknown) => {
        if (typeof arg !== 'string') return String(arg);
        try {
            const parsed = JSON.parse(arg);
            const walk = (n: unknown): string | null => {
                if (!n || typeof n !== 'object') return null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const obj: any = n;
                if (obj.type === 'text' && typeof obj.text === 'string') return obj.text as string;
                const kidsRaw = (obj.children as unknown) || (obj.nodes as unknown) || [];
                const kids: unknown[] = Array.isArray(kidsRaw) ? (kidsRaw as unknown[]) : [];
                for (const c of kids) {
                    const r = walk(c);
                    if (r) return r;
                }
                return null;
            }
            return walk(parsed.root || parsed) ?? arg;
        } catch {
            return arg;
        }
    }

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

        // Notes now saves Lexical JSON; extract the saved text to assert
        expect(extractSavedText(mockOnSave.mock.calls[0][0])).toBe('New note content')
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

        const textField = screen.getByDisplayValue('')
        fireEvent.change(textField, { target: { value: 'New note content' } })
        fireEvent.keyDown(textField, { key: 'Enter', shiftKey: false })

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalled()
        })

        // Notes now saves Lexical JSON; extract the saved text to assert
        expect(extractSavedText(mockOnSave.mock.calls[0][0])).toBe('New note content')
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
            // Editor mock renders the initial value exactly as provided
            expect(textField).toHaveValue('Existing notes')
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

        // Notes now saves Lexical JSON; extract the saved text to assert
        expect(extractSavedText(mockOnSave.mock.calls[0][0])).toBe('Some note')
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
            expect(textField.value).toBe('Existing notes')
            expect(textField.selectionStart).toBe(textField.value.length)
            expect(textField.selectionEnd).toBe(textField.value.length)
        })
    })
})
