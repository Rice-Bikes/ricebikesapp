import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PdfViewer from './PdfViewer'
import { ExtractedRow } from '../model'
import { AllTheProviders } from '../test-utils'

// Mock the useQuery hook
const mockUseMutation = vi.fn()
vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query')
    return {
        ...actual,
        useMutation: (mutation: unknown) => mockUseMutation(mutation),
    }
})

describe('PdfViewer Component', () => {
    const mockOnDataExtracted = vi.fn()
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

    const mockExtractedData: ExtractedRow[] = [
        {
            lineNumber: '1',
            quantity: '2',
            ordered: 'Y',
            partNumber: 'ABC123',
            description: 'Test Part 1',
            unit: 'EA',
            price: '19.99',
            discount: '0.00',
            total: '39.98'
        },
        {
            lineNumber: '2',
            quantity: '1',
            ordered: 'N',
            partNumber: 'XYZ789',
            description: 'Test Part 2',
            unit: 'EA',
            price: '29.99',
            discount: '5.00',
            total: '24.99'
        }
    ]

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock useMutation to return a functional mutation object
        mockUseMutation.mockReturnValue({
            mutate: vi.fn(),
            mutateAsync: vi.fn(),
            isPending: false,
            isError: false,
            error: null,
            data: null,
            isSuccess: false,
            reset: vi.fn(),
        })
    })

    test('renders PDF content title', () => {
        render(
            <PdfViewer onDataExtracted={mockOnDataExtracted} />,
            { wrapper: AllTheProviders }
        )

        expect(screen.getByText('PDF Content')).toBeInTheDocument()
    })

    test('renders table headers correctly', () => {
        render(
            <PdfViewer onDataExtracted={mockOnDataExtracted} />,
            { wrapper: AllTheProviders }
        )

        expect(screen.getByText('Line')).toBeInTheDocument()
        expect(screen.getByText('Qty')).toBeInTheDocument()
        expect(screen.getByText('Ordered')).toBeInTheDocument()
        expect(screen.getByText('Part Number')).toBeInTheDocument()
        expect(screen.getByText('Description')).toBeInTheDocument()
        expect(screen.getByText('Unit')).toBeInTheDocument()
        expect(screen.getByText('Price')).toBeInTheDocument()
        expect(screen.getByText('Discount')).toBeInTheDocument()
        expect(screen.getByText('Total')).toBeInTheDocument()
    })

    test('shows loading state while processing PDF', () => {
        // Mock mutation as pending
        mockUseMutation.mockReturnValue({
            mutate: vi.fn(),
            mutateAsync: vi.fn(),
            isPending: true,
            isError: false,
            error: null,
            data: null,
            isSuccess: false,
            reset: vi.fn(),
        })

        render(
            <PdfViewer file={mockFile} onDataExtracted={mockOnDataExtracted} />,
            { wrapper: AllTheProviders }
        )

        expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('displays extracted data in table rows', async () => {
        // Mock successful data extraction
        const mockMutate = vi.fn(() => {
            // Simulate successful extraction by calling onSuccess
            const mutation = mockUseMutation.mock.calls[0][0]
            mutation.onSuccess(mockExtractedData)
        })

        mockUseMutation.mockReturnValue({
            mutate: mockMutate,
            mutateAsync: vi.fn(),
            isPending: false,
            isError: false,
            error: null,
            data: mockExtractedData,
            isSuccess: true,
            reset: vi.fn(),
        })

        render(
            <PdfViewer file={mockFile} onDataExtracted={mockOnDataExtracted} />,
            { wrapper: AllTheProviders }
        )

        await waitFor(() => {
            // Check specific data appears in the table rows
            expect(screen.getByText('ABC123')).toBeInTheDocument()
            expect(screen.getByText('Test Part 1')).toBeInTheDocument()
            expect(screen.getByText('Y')).toBeInTheDocument()
            expect(screen.getByText('39.98')).toBeInTheDocument()

            // Check second row data
            expect(screen.getByText('XYZ789')).toBeInTheDocument()
            expect(screen.getByText('Test Part 2')).toBeInTheDocument()
            expect(screen.getByText('N')).toBeInTheDocument()
            expect(screen.getByText('29.99')).toBeInTheDocument()
            expect(screen.getByText('5.00')).toBeInTheDocument()
            expect(screen.getByText('24.99')).toBeInTheDocument()
        })

        expect(mockOnDataExtracted).toHaveBeenCalledWith(mockExtractedData)
    })

    test('calls onDataExtracted callback when data is extracted', async () => {
        const mockMutate = vi.fn(() => {
            const mutation = mockUseMutation.mock.calls[0][0]
            mutation.onSuccess(mockExtractedData)
        })

        mockUseMutation.mockReturnValue({
            mutate: mockMutate,
            mutateAsync: vi.fn(),
            isPending: false,
            isError: false,
            error: null,
            data: mockExtractedData,
            isSuccess: true,
            reset: vi.fn(),
        })

        render(
            <PdfViewer file={mockFile} onDataExtracted={mockOnDataExtracted} />,
            { wrapper: AllTheProviders }
        )

        await waitFor(() => {
            expect(mockOnDataExtracted).toHaveBeenCalledWith(mockExtractedData)
        })
    })

    test('handles empty data gracefully', async () => {
        const mockMutate = vi.fn(() => {
            const mutation = mockUseMutation.mock.calls[0][0]
            mutation.onSuccess([])
        })

        mockUseMutation.mockReturnValue({
            mutate: mockMutate,
            mutateAsync: vi.fn(),
            isPending: false,
            isError: false,
            error: null,
            data: [],
            isSuccess: true,
            reset: vi.fn(),
        })

        render(
            <PdfViewer file={mockFile} onDataExtracted={mockOnDataExtracted} />,
            { wrapper: AllTheProviders }
        )

        await waitFor(() => {
            expect(mockOnDataExtracted).toHaveBeenCalledWith([])
        })

        // Should still show headers but no rows
        expect(screen.getByText('Line')).toBeInTheDocument()
        expect(screen.getByText('Part Number')).toBeInTheDocument()
    }, 15000)

    test('handles error state correctly', async () => {
        const testError = new Error('PDF processing failed')
        const mockMutate = vi.fn(() => {
            const mutation = mockUseMutation.mock.calls[0][0]
            mutation.onError(testError)
        })

        mockUseMutation.mockReturnValue({
            mutate: mockMutate,
            mutateAsync: vi.fn(),
            isPending: false,
            isError: true,
            error: testError,
            data: null,
            isSuccess: false,
            reset: vi.fn(),
        })

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

        render(
            <PdfViewer file={mockFile} onDataExtracted={mockOnDataExtracted} />,
            { wrapper: AllTheProviders }
        )

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Error processing PDF:', testError)
        })

        consoleSpy.mockRestore()
    })

    test('does not process PDF when no file provided', () => {
        const mockMutate = vi.fn()

        mockUseMutation.mockReturnValue({
            mutate: mockMutate,
            mutateAsync: vi.fn(),
            isPending: false,
            isError: false,
            error: null,
            data: null,
            isSuccess: false,
            reset: vi.fn(),
        })

        render(
            <PdfViewer onDataExtracted={mockOnDataExtracted} />,
            { wrapper: AllTheProviders }
        )

        expect(mockMutate).not.toHaveBeenCalled()
    })

    test('processes PDF when file changes', () => {
        const mockMutate = vi.fn()

        mockUseMutation.mockReturnValue({
            mutate: mockMutate,
            mutateAsync: vi.fn(),
            isPending: false,
            isError: false,
            error: null,
            data: null,
            isSuccess: false,
            reset: vi.fn(),
        })

        const { rerender } = render(
            <PdfViewer onDataExtracted={mockOnDataExtracted} />,
            { wrapper: AllTheProviders }
        )

        expect(mockMutate).not.toHaveBeenCalled()

        // Update with a file
        rerender(
            <PdfViewer file={mockFile} onDataExtracted={mockOnDataExtracted} />
        )

        expect(mockMutate).toHaveBeenCalledWith(mockFile)
    })
})
