import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import WhiteboardEntryModal from './WhiteboardEntryModal'
import DBModel, { OrderRequest, Part } from '../model'
import { AllTheProviders } from '../test-utils'
import { queryClient } from '../app/queryClient'
import { toast } from 'react-toastify'

vi.mock('../model', () => ({
  __esModule: true,
  default: {
    getOrderRequests: vi.fn().mockResolvedValue([]),
    postOrderRequest: vi.fn().mockResolvedValue({}),
    putOrderRequest: vi.fn().mockResolvedValue({}),
    deleteOrderRequest: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn() },
}))

type GridValueGetter = (params: { data?: OrderRequest | null }) => unknown
type GridColumnDef = {
  colId: string
  field?: string
  type?: string
  valueGetter?: GridValueGetter
  onCellClicked?: (params: { data: OrderRequest }) => void
}
type GridProps = {
  rowData?: OrderRequest[]
  columnDefs?: GridColumnDef[]
  columnTypes?: {
    editableColumn: {
      onCellValueChanged: (params: { data: OrderRequest }) => void
      editable?: (params: { colDef?: { field?: string } }) => boolean
      cellStyle?: (params: { colDef?: { field?: string } }) => unknown
    }
  }
}

type MutationOptions = {
  mutationFn?: (req: OrderRequest) => unknown
  onSuccess?: () => void
  onError?: (error: Error) => void
}

type QueryOptions = {
  queryKey?: unknown
  queryFn?: () => unknown
  select?: (data: unknown) => unknown
}

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()

const createMutate = vi.fn()
const updateMutate = vi.fn()
const deleteMutate = vi.fn()

let capturedGridProps: GridProps | null = null
let capturedMutations: MutationOptions[] = []
let capturedQueryOptions: QueryOptions | null = null

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: (options: unknown) => mockUseQuery(options),
    useMutation: (options: unknown) => mockUseMutation(options),
  }
})

vi.mock('ag-grid-react', () => ({
  AgGridReact: (props: GridProps) => {
    capturedGridProps = props
    const rows = props.rowData ?? []
    return (
      <div data-testid="ag-grid">
        <span>{`Grid with ${rows.length} rows`}</span>
        <button
          data-testid="trigger-add-to-transaction"
          onClick={() => props.columnDefs?.find((c: GridColumnDef) => c.colId === 'add')?.onCellClicked?.({ data: rows[0] as OrderRequest })}
        >
          add to transaction
        </button>
        <button
          data-testid="trigger-delete"
          onClick={() => props.columnDefs?.find((c: GridColumnDef) => c.colId === 'delete')?.onCellClicked?.({ data: rows[0] as OrderRequest })}
        >
          delete
        </button>
      </div>
    )
  }
}))

vi.mock('./ItemSearch/SearchModal', () => ({
  default: ({ onRowClick }: { onRowClick: (e: { data: { item_id: string } }) => void }) => (
    <button
      data-testid="search-modal-button"
      onClick={() => onRowClick({ data: { item_id: 'row-1' } })}
    >
      Add Part
    </button>
  ),
}))

describe('WhiteboardEntryModal', () => {
  const mockOnClose = vi.fn()
  const mockSetWaitingOnParts = vi.fn()
  const mockHandleAddOrderedPart = vi.fn()
  const mockUser = 'user-123'
  const mockTransactionId = 'transaction-123'

  const mockParts: Part[] = [
    {
      item_id: '1',
      upc: '111',
      name: 'Part One',
      description: 'desc',
      brand: 'Brand',
      stock: 1,
      minimum_stock: 0,
      standard_price: 10,
      wholesale_cost: 5,
      condition: 'new',
      disabled: false,
      managed: true,
      category_1: 'cat',
      category_2: null,
      category_3: null,
      specifications: {},
      features: [],
    },
  ]

  const mockOrderRequests: OrderRequest[] = [
    {
      order_request_id: 'or-1',
      created_by: mockUser,
      transaction_id: mockTransactionId,
      item_id: '1',
      date_created: 'now',
      quantity: 1,
      notes: 'note',
      ordered: false,
      Item: mockParts[0],
      User: {
        user_id: 'u1',
        username: 'user',
        firstname: 'Test',
        lastname: 'User',
        active: true,
        permissions: [],
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    capturedGridProps = null
    capturedMutations = []
    capturedQueryOptions = null
    vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()

    let mutationIndex = 0
    const mutationOrder = [createMutate, updateMutate, deleteMutate]

    mockUseMutation.mockImplementation((options: MutationOptions) => {
      capturedMutations.push(options)
      const mutate = mutationOrder[mutationIndex++] ?? vi.fn()
      return {
        mutate,
        mutateAsync: mutate,
        isLoading: false,
        isError: false,
        reset: vi.fn(),
      }
    })

    mockUseQuery.mockImplementation((options: QueryOptions) => {
      capturedQueryOptions = options
      return {
        data: mockOrderRequests,
        error: null,
        fetchStatus: 'idle',
      }
    })
  })

  it('renders data rows and sets waitingOnParts', () => {
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
    expect(screen.getByTestId('ag-grid')).toHaveTextContent('Grid with 1 rows')
    expect(mockSetWaitingOnParts).toHaveBeenCalledWith(true)
  })

  it('shows loading when query has no data yet', () => {
    mockUseQuery.mockReturnValueOnce({ data: undefined, error: null, fetchStatus: 'fetching' })

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

  it('marks not waiting when query returns empty array', () => {
    mockUseQuery.mockReturnValueOnce({ data: [], error: null, fetchStatus: 'idle' })

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

    expect(screen.getByTestId('ag-grid')).toHaveTextContent('Grid with 0 rows')
    expect(mockSetWaitingOnParts).toHaveBeenCalledWith(false)
  })

  it('creates an order request via SearchModal', () => {
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

    fireEvent.click(screen.getByTestId('search-modal-button'))

    expect(createMutate).toHaveBeenCalledWith({
      item_id: 'row-1',
      quantity: 1,
      notes: '',
      transaction_id: mockTransactionId,
      created_by: mockUser,
    })
  })

  it('updates order request on editable column change', () => {
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

    if (!capturedGridProps?.columnTypes?.editableColumn) {
      throw new Error('Grid props not captured')
    }

    capturedGridProps.columnTypes.editableColumn.onCellValueChanged({
      data: { ...mockOrderRequests[0], notes: 'updated' },
    })

    expect(updateMutate).toHaveBeenCalledWith({ ...mockOrderRequests[0], notes: 'updated' })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['orderRequest', mockTransactionId] })
  })

  it('deletes and adds to transaction via column actions', () => {
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

    fireEvent.click(screen.getByTestId('trigger-delete'))
    fireEvent.click(screen.getByTestId('trigger-add-to-transaction'))

    expect(deleteMutate).toHaveBeenCalledWith(mockOrderRequests[0])
    expect(mockHandleAddOrderedPart).toHaveBeenCalledWith(mockParts[0])
  })

  it('runs column value getters and editable styling', () => {
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

    const columnDefs = capturedGridProps?.columnDefs ?? []
    const nameGetter = columnDefs[0]?.valueGetter
    const notesGetter = columnDefs[1]?.valueGetter
    const priceGetter = columnDefs[2]?.valueGetter
    const upcGetter = columnDefs[3]?.valueGetter
    const userGetter = columnDefs[4]?.valueGetter

    expect(nameGetter?.({ data: mockOrderRequests[0] })).toBe('Part One')
    expect(notesGetter?.({ data: mockOrderRequests[0] })).toBe('note')
    expect(priceGetter?.({ data: mockOrderRequests[0] })).toBe(10)
    expect(upcGetter?.({ data: mockOrderRequests[0] })).toBe('111')
    expect(userGetter?.({ data: mockOrderRequests[0] })).toBe('Test User')

    expect(nameGetter?.({ data: null as unknown as OrderRequest })).toBe('')
    expect(notesGetter?.({ data: null as unknown as OrderRequest })).toBe('')
    expect(priceGetter?.({ data: null as unknown as OrderRequest })).toBe('')
    expect(upcGetter?.({ data: null as unknown as OrderRequest })).toBe('')
    expect(userGetter?.({ data: null as unknown as OrderRequest })).toBe('')

    const editableColumn = capturedGridProps?.columnTypes?.editableColumn
    expect(editableColumn?.editable?.({ colDef: { field: 'notes' } })).toBe(true)
    expect(editableColumn?.editable?.({ colDef: { field: 'other' } })).toBe(false)
    expect(editableColumn?.cellStyle?.({ colDef: { field: 'notes' } })).toEqual({ backgroundColor: '#2244CC44' })
  })

  it('runs mutation success handlers to invalidate queries', () => {
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

    const invalidateSpy = queryClient.invalidateQueries as unknown as vi.Mock
    invalidateSpy.mockClear()

    capturedMutations.forEach((m) => m.onSuccess?.())

    expect(invalidateSpy).toHaveBeenCalledTimes(3)
  })

  it('executes query select and mutationFns', async () => {
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

    expect(capturedQueryOptions?.queryKey).toEqual(['orderRequest', mockTransactionId])
    await capturedQueryOptions?.queryFn?.()
    capturedQueryOptions?.select?.(mockOrderRequests)

    capturedMutations.forEach((m) => {
      m.mutationFn?.(mockOrderRequests[0])
      m.onError?.(new Error('fail'))
    })

    expect(DBModel.postOrderRequest).toHaveBeenCalled()
    expect(DBModel.putOrderRequest).toHaveBeenCalled()
    expect(DBModel.deleteOrderRequest).toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalled()
  })
})
