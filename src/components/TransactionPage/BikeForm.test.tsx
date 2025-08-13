import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useMutation } from '@tanstack/react-query'
import NewBikeForm from './BikeForm'

// Mock DBModel
vi.mock('../../model', () => ({
    default: {
        createBike: vi.fn(),
    },
}))

// Mock queryClient
vi.mock('../../app/queryClient', () => ({
    queryClient: {
        invalidateQueries: vi.fn(),
    },
}))

// Mock useMutation
const mockMutate = vi.fn()
vi.mock('@tanstack/react-query', () => ({
    useMutation: vi.fn(),
}))

describe('NewBikeForm Component', () => {
    const mockOnBikeCreated = vi.fn()
    const mockOnClose = vi.fn()

    const defaultProps = {
        onBikeCreated: mockOnBikeCreated,
        isOpen: true,
        onClose: mockOnClose,
        bike: {
            bike_id: '',
            date_created: '',
            make: '',
            model: '',
            description: '',
        },
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // Set up the mock return value for useMutation
        // @ts-expect-error - Mock return value for testing
        vi.mocked(useMutation).mockReturnValue({
            mutate: mockMutate,
            mutateAsync: vi.fn(),
            reset: vi.fn(),
            status: 'idle',
        })
    })

    test('renders form when isOpen is true', () => {
        render(<NewBikeForm {...defaultProps} />)

        expect(screen.getByText('Bike Information')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Submit Bike' })).toBeInTheDocument()
    })

    test('does not render when isOpen is false', () => {
        render(<NewBikeForm {...defaultProps} isOpen={false} />)

        expect(screen.queryByText('Bike Information')).not.toBeInTheDocument()
    })

    test('renders close button', () => {
        render(<NewBikeForm {...defaultProps} />)

        const closeButton = screen.getByText('x')
        expect(closeButton).toBeInTheDocument()
    })

    test('calls onClose when close button is clicked', () => {
        render(<NewBikeForm {...defaultProps} />)

        const closeButton = screen.getByText('x')
        fireEvent.click(closeButton)

        expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('renders all form fields with correct placeholders', () => {
        render(<NewBikeForm {...defaultProps} />)

        expect(screen.getByPlaceholderText('Make:')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Model:')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Description:')).toBeInTheDocument()
    })

    test('populates form fields with bike prop values', () => {
        const bikeWithData = {
            bike_id: 'bike123',
            date_created: '2023-01-01',
            make: 'Trek',
            model: 'Domane',
            description: 'Road bike in excellent condition',
        }

        render(<NewBikeForm {...defaultProps} bike={bikeWithData} />)

        expect(screen.getByDisplayValue('Trek')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Domane')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Road bike in excellent condition')).toBeInTheDocument()
    })

    test('updates form state when input values change', async () => {
        render(<NewBikeForm {...defaultProps} />)

        const makeInput = screen.getByPlaceholderText('Make:')
        const modelInput = screen.getByPlaceholderText('Model:')
        const descriptionInput = screen.getByPlaceholderText('Description:')

        fireEvent.change(makeInput, { target: { value: 'Specialized' } })
        fireEvent.change(modelInput, { target: { value: 'Allez' } })
        fireEvent.change(descriptionInput, { target: { value: 'Entry-level road bike' } })

        expect(makeInput).toHaveValue('Specialized')
        expect(modelInput).toHaveValue('Allez')
        expect(descriptionInput).toHaveValue('Entry-level road bike')
    })

    test('calls useMutation with correct parameters on form submission', async () => {
        render(<NewBikeForm {...defaultProps} />)

        const makeInput = screen.getByPlaceholderText('Make:')
        const modelInput = screen.getByPlaceholderText('Model:')
        const descriptionInput = screen.getByPlaceholderText('Description:')
        const submitButton = screen.getByRole('button', { name: 'Submit Bike' })

        fireEvent.change(makeInput, { target: { value: 'Giant' } })
        fireEvent.change(modelInput, { target: { value: 'Escape' } })
        fireEvent.change(descriptionInput, { target: { value: 'Hybrid bike' } })

        fireEvent.click(submitButton)

        expect(mockMutate).toHaveBeenCalledWith({
            make: 'Giant',
            model: 'Escape',
            description: 'Hybrid bike',
        })
    })

    test('form submission calls mutate function', async () => {
        render(<NewBikeForm {...defaultProps} />)

        // Fill out required fields to pass validation
        const makeInput = screen.getByPlaceholderText('Make:')
        const modelInput = screen.getByPlaceholderText('Model:')
        const descriptionInput = screen.getByPlaceholderText('Description:')
        
        fireEvent.change(makeInput, { target: { value: 'Test Make' } })
        fireEvent.change(modelInput, { target: { value: 'Test Model' } })
        fireEvent.change(descriptionInput, { target: { value: 'Test Description' } })

        const submitButton = screen.getByRole('button', { name: 'Submit Bike' })
        fireEvent.click(submitButton)

        expect(mockMutate).toHaveBeenCalled()
    })

    test('all form fields are required', () => {
        render(<NewBikeForm {...defaultProps} />)

        const makeInput = screen.getByPlaceholderText('Make:')
        const modelInput = screen.getByPlaceholderText('Model:')
        const descriptionInput = screen.getByPlaceholderText('Description:')

        expect(makeInput).toBeRequired()
        expect(modelInput).toBeRequired()
        expect(descriptionInput).toBeRequired()
    })

    test('calls useMutation when component renders', () => {
        render(<NewBikeForm {...defaultProps} />)

        expect(useMutation).toHaveBeenCalled()
    })

    test('updates form when bike prop changes', () => {
        const initialBike = {
            bike_id: '',
            date_created: '',
            make: 'Initial',
            model: 'Bike',
            description: 'Initial description',
        }

        const { rerender } = render(<NewBikeForm {...defaultProps} bike={initialBike} />)

        expect(screen.getByDisplayValue('Initial')).toBeInTheDocument()

        const updatedBike = {
            bike_id: 'updated123',
            date_created: '2023-02-01',
            make: 'Updated',
            model: 'Model',
            description: 'Updated description',
        }

        rerender(<NewBikeForm {...defaultProps} bike={updatedBike} />)

        expect(screen.getByDisplayValue('Updated')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Model')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Updated description')).toBeInTheDocument()
    })

    test('form has proper accessibility attributes', () => {
        render(<NewBikeForm {...defaultProps} />)

        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
        expect(dialog).toHaveAttribute('aria-modal', 'true')
    })
})
