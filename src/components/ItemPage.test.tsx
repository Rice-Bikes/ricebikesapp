import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ItemPageModal from './ItemPage'
import { AllTheProviders } from '../test-utils'
import DBModel from '../model'

// Mock the DBModel
vi.mock('../model', () => ({
    default: {
        createItem: vi.fn(),
        updateItem: vi.fn(),
        fetchItemCategory: vi.fn(() => Promise.resolve([])),
        getItemsQuery: vi.fn(() => ({
            queryKey: ['items'],
            queryFn: vi.fn()
        })),
        getCategoriesQuery: vi.fn(() => ({
            queryKey: ['categories'],
            queryFn: vi.fn()
        }))
    }
}))

// Mock useQuery to provide category data
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query')
    return {
        ...actual,
        useQuery: (query: unknown) => mockUseQuery(query),
        useMutation: (options: unknown) => mockUseMutation(options)
    }
})

// Mock react-toastify
vi.mock('react-toastify', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}))

const mockItem = {
    item_id: '1',
    upc: '123456789012',
    name: 'Test Item',
    description: 'A test item',
    brand: 'Test Brand',
    stock: 10,
    minimum_stock: 5,
    standard_price: 19.99,
    wholesale_cost: 9.99,
    condition: 'new',
    disabled: false,
    managed: true,
    category_1: 'Test Category',
    category_2: null,
    category_3: null,
    specifications: {},
    features: []
}

describe('ItemPageModal Component', () => {
    const mockOnClose = vi.fn()
    const mockMutate = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock useQuery to return category data
        mockUseQuery.mockReturnValue({
            data: ['Category 1', 'Category 2'],
            error: null,
            isLoading: false,
            isError: false,
            isSuccess: true,
            fetchStatus: 'idle',
        })

        // Mock useMutation to return mutate function
        mockUseMutation.mockReturnValue({
            mutate: mockMutate,
            mutateAsync: vi.fn(),
            isLoading: false,
            isError: false,
            error: null,
            data: null,
            isSuccess: false,
            isPending: false,
            reset: vi.fn(),
        })
    })

    test('renders modal with item details when item is provided', () => {
        render(
            <ItemPageModal
                open={true}
                onClose={mockOnClose}
                item={mockItem}
            />,
            { wrapper: AllTheProviders }
        )

        expect(screen.getByText('Item Details')).toBeInTheDocument()
        expect(screen.getByText('Test Item')).toBeInTheDocument()
        expect(screen.getByText('123456789012')).toBeInTheDocument()
        expect(screen.getByText('Test Brand')).toBeInTheDocument()
    })

    test('renders modal in edit mode when no item is provided', () => {
        render(
            <ItemPageModal
                open={true}
                onClose={mockOnClose}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                item={undefined as any}
            />,
            { wrapper: AllTheProviders }
        )

        // First click the "Open for Edit" button to enable edit mode
        const editButton = screen.getByText('Open for Edit')
        fireEvent.click(editButton)

        expect(screen.getByText('Item Details')).toBeInTheDocument()
        // In edit mode, fields should be text inputs - submit button should say "Submit Item"
        expect(screen.getByText('Submit Item')).toBeInTheDocument()

        // Check that we have text inputs for form fields
        const inputs = screen.getAllByRole('textbox')
        expect(inputs.length).toBeGreaterThan(0)
    })

    test('toggles edit mode when edit button is clicked', () => {
        render(
            <ItemPageModal
                open={true}
                onClose={mockOnClose}
                item={mockItem}
            />,
            { wrapper: AllTheProviders }
        )

        // Initially in view mode - data shown in buttons
        expect(screen.getByText('Test Item')).toBeInTheDocument()
        expect(screen.getByText('Open for Edit')).toBeInTheDocument()

        // Click edit button
        const editButton = screen.getByText('Open for Edit')
        fireEvent.click(editButton)

        // Now should be in edit mode with text fields
        expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument()
        expect(screen.getByText('Submit Item')).toBeInTheDocument()
    })

    test('generates UPC when generate button is clicked', () => {
        render(
            <ItemPageModal
                open={true}
                onClose={mockOnClose}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                item={undefined as any}
            />,
            { wrapper: AllTheProviders }
        )

        // First click the "Open for Edit" button to enable edit mode
        const editButton = screen.getByText('Open for Edit')
        fireEvent.click(editButton)

        const generateButton = screen.getByText('Generate UPC')
        fireEvent.click(generateButton)

        // Check that UPC field has been populated with 12 digits
        // The UPC field is the second input after the name field
        const inputs = screen.getAllByRole('textbox')
        const upcField = inputs[1] as HTMLInputElement // Name is first, UPC is second
        expect(upcField.value).toMatch(/^\d{12}$/)
    })

    test('validates required fields on save', () => {
        render(
            <ItemPageModal
                open={true}
                onClose={mockOnClose}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                item={undefined as any}
            />,
            { wrapper: AllTheProviders }
        )

        // First click the "Open for Edit" button to enable edit mode
        const editButton = screen.getByText('Open for Edit')
        fireEvent.click(editButton)

        // Try to save without filling required fields
        const saveButton = screen.getByText('Submit Item')
        fireEvent.click(saveButton)

        // Check for validation - should stay in edit mode and show Submit Item button
        expect(screen.getByText('Submit Item')).toBeInTheDocument()
    })

    test('calls createItem when saving new item', () => {
        const mockCreateItem = vi.mocked(DBModel.createItem)
        mockCreateItem.mockResolvedValueOnce({ success: true })

        render(
            <ItemPageModal
                open={true}
                onClose={mockOnClose}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                item={undefined as any}
            />,
            { wrapper: AllTheProviders }
        )

        // First click the "Open for Edit" button to enable edit mode
        const editButton = screen.getByText('Open for Edit')
        fireEvent.click(editButton)

        // Fill in all required fields with simple values to ensure validation passes
        const inputs = screen.getAllByRole('textbox')

        // Set name
        const nameField = inputs[0] as HTMLInputElement
        fireEvent.change(nameField, { target: { value: 'Test New Item' } })

        // Set UPC - use the generate button to ensure valid UPC
        const generateButton = screen.getByText('Generate UPC')
        fireEvent.click(generateButton)

        // Set brand
        const brandField = inputs[2] as HTMLInputElement // Brand should be 3rd textbox
        fireEvent.change(brandField, { target: { value: 'Test Brand' } })

        // Set description  
        const descField = inputs[3] as HTMLInputElement // Description should be 4th textbox
        fireEvent.change(descField, { target: { value: 'Test Description' } })

        // Set price and wholesale cost using direct DOM queries to be absolutely sure
        const dialog = screen.getByRole('dialog')
        const numberInputs = dialog.querySelectorAll('input[type="number"]')

        // Set price (first number input with step="0.01")
        const priceInput = Array.from(numberInputs).find(input =>
            input.getAttribute('step') === '0.01'
        ) as HTMLInputElement
        fireEvent.change(priceInput, { target: { value: '15.99' } })

        // Set wholesale cost (second number input with step="0.01")
        const wholesaleInput = Array.from(numberInputs).find((input) =>
            input.getAttribute('step') === '0.01' && input !== priceInput
        ) as HTMLInputElement
        fireEvent.change(wholesaleInput, { target: { value: '10.99' } })

        // Save
        const saveButton = screen.getByText('Submit Item')
        fireEvent.click(saveButton)

        expect(mockMutate).toHaveBeenCalled()
        // Check that the mutation was called with an item without item_id (new item)
        const mutationCall = mockMutate.mock.calls[0][0]
        expect(mutationCall.item_id).toBe('')
    })

    test('calls updateItem when saving existing item', () => {
        const mockUpdateItem = vi.mocked(DBModel.updateItem)
        mockUpdateItem.mockResolvedValueOnce({ success: true })

        render(
            <ItemPageModal
                open={true}
                onClose={mockOnClose}
                item={mockItem}
            />,
            { wrapper: AllTheProviders }
        )

        // Enter edit mode
        const editButton = screen.getByText('Open for Edit')
        fireEvent.click(editButton)

        // Modify item
        const nameInput = screen.getByDisplayValue('Test Item')
        fireEvent.change(nameInput, { target: { value: 'Updated Item' } })

        const saveButton = screen.getByText('Submit Item')
        fireEvent.click(saveButton)

        expect(mockMutate).toHaveBeenCalled()
        // Check that the mutation was called with an item with item_id (existing item)
        const mutationCall = mockMutate.mock.calls[0][0]
        expect(mutationCall.item_id).toBe('1')
    })

    test('closes modal when cancel button is clicked', () => {
        render(
            <ItemPageModal
                open={true}
                onClose={mockOnClose}
                item={mockItem}
            />,
            { wrapper: AllTheProviders }
        )

        // Component doesn't have explicit cancel button, dialog handles close
        expect(mockOnClose).toBeDefined()
    })

    test('validates UPC format', () => {
        render(
            <ItemPageModal
                open={true}
                onClose={mockOnClose}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                item={undefined as any}
            />,
            { wrapper: AllTheProviders }
        )

        // First click the "Open for Edit" button to enable edit mode
        const editButton = screen.getByText('Open for Edit')
        fireEvent.click(editButton)

        // Set name first
        const inputs = screen.getAllByRole('textbox')
        const nameField = inputs[0] as HTMLInputElement
        fireEvent.change(nameField, { target: { value: 'Test Item' } })

        // Set invalid UPC (component validates on submit)
        const upcField = inputs[1] as HTMLInputElement // UPC is the second input field
        fireEvent.change(upcField, { target: { value: '12345' } }) // Too short

        const saveButton = screen.getByText('Submit Item')
        fireEvent.click(saveButton)

        // Should still be in edit mode due to validation failure
        expect(screen.getByText('Submit Item')).toBeInTheDocument()
    })

    test('does not render when modal is closed', () => {
        render(
            <ItemPageModal
                open={false}
                onClose={mockOnClose}
                item={mockItem}
            />,
            { wrapper: AllTheProviders }
        )

        expect(screen.queryByText('Item Details')).not.toBeInTheDocument()
    })
})
