import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import WhiteboardEntryModal from './WhiteboardEntryModal'
import { OrderRequest, Part } from '../model'
import { AllTheProviders } from '../test-utils'

// Mock the useQuery hook
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: (query: unknown) => mockUseQuery(query),
    useMutation: (mutation: unknown) => mockUseMutation(mutation),
  }
})

// Mock ag-grid-react
vi.mock('ag-grid-react', () => ({
  AgGridReact: ({ rowData }: { rowData: OrderRequest[] | undefined | null }) => (
    <div data-testid="ag-grid">
      <span>Grid with {rowData ? rowData.length : 0} rows</span>
      {rowData && rowData.length > 0 && (
        <ul>
          {rowData.map((row: OrderRequest, index: number) => (
            <li key={index} data-testid="grid-row">
              {row.Item?.name || 'No name'} - {row.notes || 'No notes'}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}))

// Mock SearchModal
vi.mock('./ItemSearch/SearchModal', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="search-modal-button">{children}</button>
  )
}))

describe('WhiteboardEntryModal Component', () => {
  const mockOnClose = vi.fn()
  const mockSetWaitingOnParts = vi.fn()
  const mockHandleAddOrderedPart = vi.fn()
  const mockUser = 'user123'
  const mockTransactionId = 'transaction123'

  const mockParts: Part[] = [
    {
      item_id: '1',
      upc: '123456789012',
      name: 'Test Part 1',
      description: 'A test part',
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
      name: 'Test Part 2',
      description: 'Another test part',
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

  const mockOrderRequests: OrderRequest[] = [
    {
      order_request_id: 'order1',
      created_by: 'user123',
      transaction_id: 'transaction123',
      item_id: '1',
      date_created: '2025-08-06T10:00:00Z',
      quantity: 1,
      notes: 'Test note 1',
      ordered: false,
      Item: mockParts[0],
      User: {
        user_id: 'user123',
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        active: true,
        permissions: []
      }
    },
    {
      order_request_id: 'order2',
      created_by: 'user123',
      transaction_id: 'transaction123',
      item_id: '2',
      date_created: '2025-08-06T11:00:00Z',
      quantity: 2,
      notes: 'Test note 2',
      ordered: false,
      Item: mockParts[1],
      User: {
        user_id: 'user123',
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        active: true,
        permissions: []
      }
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock useMutation to return a functional mutation object
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isLoading: false,
      isError: false,
      error: null,
      data: null,
      isSuccess: false,
      isPending: false,
      reset: vi.fn(),
    })

    // Mock useQuery to return successful data by default
    mockUseQuery.mockReturnValue({
      data: mockOrderRequests,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      fetchStatus: 'idle',
    })
  })

  test('renders dialog with title', () => {
    render(
      <WhiteboardEntryModal
        open={true}
        onClose={mockOnClose}
        parts={mockParts}
        setWaitingOnParts={mockSetWaitingOnParts}
        transaction_id={mockTransactionId}
        user_id={mockUser}
        waitingOnParts={false}
        handleAddOrderedPart={mockHandleAddOrderedPart}
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText('Parts Waiting')).toBeInTheDocument()
    expect(screen.getByText('Close')).toBeInTheDocument()
    expect(screen.getByTestId('search-modal-button')).toBeInTheDocument()
    expect(screen.getByText('Add Part')).toBeInTheDocument()
  })

  test('displays order requests in the grid', () => {
    render(
      <WhiteboardEntryModal
        open={true}
        onClose={mockOnClose}
        parts={mockParts}
        setWaitingOnParts={mockSetWaitingOnParts}
        transaction_id={mockTransactionId}
        user_id={mockUser}
        waitingOnParts={false}
        handleAddOrderedPart={mockHandleAddOrderedPart}
      />,
      { wrapper: AllTheProviders }
    )

    // Data should be immediately available with mocked useQuery
    expect(screen.getByTestId('ag-grid')).toBeInTheDocument()
    expect(screen.getByText(`Grid with ${mockOrderRequests.length} rows`)).toBeInTheDocument()

    // Check that the grid rows are rendered
    const gridRows = screen.getAllByTestId('grid-row')
    expect(gridRows).toHaveLength(mockOrderRequests.length)
    expect(gridRows[0]).toHaveTextContent('Test Part 1')
    expect(gridRows[1]).toHaveTextContent('Test Part 2')
  })

  test('updates waitingOnParts state based on order requests', () => {
    render(
      <WhiteboardEntryModal
        open={true}
        onClose={mockOnClose}
        parts={mockParts}
        setWaitingOnParts={mockSetWaitingOnParts}
        transaction_id={mockTransactionId}
        user_id={mockUser}
        waitingOnParts={false}
        handleAddOrderedPart={mockHandleAddOrderedPart}
      />,
      { wrapper: AllTheProviders }
    )

    // Since we have mocked order requests, setWaitingOnParts should be called with true
    expect(mockSetWaitingOnParts).toHaveBeenCalledWith(true)
  })

  test('shows loading state when order requests are loading', () => {
    // Mock useQuery to return loading state
    mockUseQuery.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
      isError: false,
      isSuccess: false,
      fetchStatus: 'fetching',
    })

    render(
      <WhiteboardEntryModal
        open={true}
        onClose={mockOnClose}
        parts={mockParts}
        setWaitingOnParts={mockSetWaitingOnParts}
        transaction_id={mockTransactionId}
        user_id={mockUser}
        waitingOnParts={false}
        handleAddOrderedPart={mockHandleAddOrderedPart}
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('handles empty order requests', () => {
    // Mock useQuery to return empty array
    mockUseQuery.mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      fetchStatus: 'idle',
    })

    render(
      <WhiteboardEntryModal
        open={true}
        onClose={mockOnClose}
        parts={mockParts}
        setWaitingOnParts={mockSetWaitingOnParts}
        transaction_id={mockTransactionId}
        user_id={mockUser}
        waitingOnParts={true}
        handleAddOrderedPart={mockHandleAddOrderedPart}
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText(/Grid with 0 rows/)).toBeInTheDocument()
    expect(mockSetWaitingOnParts).toHaveBeenCalledWith(false)
  })
})
