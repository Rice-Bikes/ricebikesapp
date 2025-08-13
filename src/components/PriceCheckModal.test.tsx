import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PriceCheckModal from './PriceCheckModal'
import { queryClient } from '../app/queryClient'
import { Part } from '../model'
import { AllTheProviders } from '../test-utils'
import { toast } from 'react-toastify'

// Mock the useQuery hook
const mockUseQuery = vi.fn()
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: (query: unknown) => mockUseQuery(query),
  }
})

// Mock ItemPageModal component
vi.mock('./ItemPage', () => ({
  default: ({ open, onClose, item }: { open: boolean, onClose: () => void, item?: Part }) =>
    open ? (
      <div data-testid="item-page-modal">
        Item Details: {item?.name || 'No item selected'}
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
}))

// Mock CustomNoRowsOverlay component
vi.mock('./ItemSearch/CreateItemModal', () => ({
  CustomNoRowsOverlay: ({ searchTerm }: { searchTerm: string }) => (
    <div data-testid="custom-no-rows-overlay">Add Item: {searchTerm}</div>
  )
}))

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn()
  }
}))

describe('PriceCheckModal Component', () => {
  const mockOnClose = vi.fn()
  const mockItems: Part[] = [
    {
      item_id: '1',
      upc: '123456789012',
      name: 'Test Item 1',
      description: 'A test item',
      brand: 'Test Brand',
      stock: 10,
      minimum_stock: 5,
      standard_price: 19.99,
      wholesale_cost: 9.99,
      condition: 'new',
      disabled: false,
      managed: true,
      category_1: 'Test',
      category_2: null,
      category_3: null,
      specifications: {},
      features: []
    },
    {
      item_id: '2',
      upc: '234567890123',
      name: 'Test Item 2',
      description: 'Another test item',
      brand: 'Test Brand 2',
      stock: 5,
      minimum_stock: 2,
      standard_price: 29.99,
      wholesale_cost: 19.99,
      condition: 'new',
      disabled: false,
      managed: true,
      category_1: 'Test',
      category_2: null,
      category_3: null,
      specifications: {},
      features: []
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock useQuery to return successful data
    mockUseQuery.mockReturnValue({
      data: mockItems,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
    })

    // Also set query data in the client for consistency
    queryClient.setQueryData(['items'], mockItems)
  })

  test('renders dialog with search field', () => {
    render(
      <PriceCheckModal open={true} onClose={mockOnClose} />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText('Enter UPC')).toBeInTheDocument()
    expect(screen.getByLabelText('Search Term')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  test('handles search for existing item', async () => {
    render(
      <PriceCheckModal open={true} onClose={mockOnClose} />,
      { wrapper: AllTheProviders }
    )

    const input = screen.getByLabelText('Search Term')
    fireEvent.change(input, { target: { value: '123456789012' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByTestId('item-page-modal')).toBeInTheDocument()
      expect(screen.getByText(/Test Item 1/)).toBeInTheDocument()
    })
  })

  test('shows add item UI for non-existent item', async () => {
    render(
      <PriceCheckModal open={true} onClose={mockOnClose} />,
      { wrapper: AllTheProviders }
    )

    const input = screen.getByLabelText('Search Term')
    fireEvent.change(input, { target: { value: '999999999999' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('Item not found. Add new item?')).toBeInTheDocument()
      expect(screen.getByTestId('custom-no-rows-overlay')).toBeInTheDocument()
    })
  })

  test('closes dialog when cancel is clicked', () => {
    render(
      <PriceCheckModal open={true} onClose={mockOnClose} />,
      { wrapper: AllTheProviders }
    )

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  test('closes item page modal and parent dialog when item page is closed', async () => {
    render(
      <PriceCheckModal open={true} onClose={mockOnClose} />,
      { wrapper: AllTheProviders }
    )

    // First search for an item
    const input = screen.getByLabelText('Search Term')
    fireEvent.change(input, { target: { value: '123456789012' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    // Wait for item page modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('item-page-modal')).toBeInTheDocument()
    })

    // Close the item page modal
    const closeButton = screen.getByRole('button', { name: 'Close Modal' })
    fireEvent.click(closeButton)

    // Check that the parent dialog was also closed
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  test('displays error message when query fails', () => {
    // Mock useQuery to return an error
    mockUseQuery.mockReturnValue({
      data: null,
      error: { message: 'Failed to fetch items' },
      isLoading: false,
      isError: true,
      isSuccess: false,
    })

    render(
      <PriceCheckModal open={true} onClose={mockOnClose} />,
      { wrapper: AllTheProviders }
    )

    // Check that toast.error was called with the error message
    expect(toast.error).toHaveBeenCalledWith('Error loading items data')
  })
})
