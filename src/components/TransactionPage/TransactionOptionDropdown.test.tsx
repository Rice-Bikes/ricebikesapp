import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import TransactionOptionDropdown from './TransactionOptionDropdown'

describe('TransactionOptionDropdown Component', () => {
    const mockSetTransactionType = vi.fn()
    const mockIsAllowed = vi.fn()

    const defaultProps = {
        options: ['checkout', 'checkin', 'repair', 'sale'],
        colors: ['#4CAF50', '#2196F3', '#FF9800', '#F44336'],
        setTransactionType: mockSetTransactionType,
        initialOption: 'checkout',
        isAllowed: mockIsAllowed,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockIsAllowed.mockReturnValue(true)
    })

    test('renders with initial option selected', () => {
        render(<TransactionOptionDropdown {...defaultProps} />)

        const button = screen.getByRole('button', { name: 'select merge strategy' })
        expect(button).toBeInTheDocument()
        expect(button).toHaveTextContent('checkout')
    })

    test('displays correct background color for initial option', () => {
        render(<TransactionOptionDropdown {...defaultProps} />)

        const button = screen.getByRole('button', { name: 'select merge strategy' })
        // The button should have the first color from the colors array
        expect(button).toHaveStyle({ backgroundColor: '#4CAF50' })
    })

    test('opens dropdown menu when button is clicked', async () => {
        render(<TransactionOptionDropdown {...defaultProps} />)

        const button = screen.getByRole('button', { name: 'select merge strategy' })
        fireEvent.click(button)

        await waitFor(() => {
            expect(screen.getByText('Choose a transaction type')).toBeInTheDocument()
        })
    })

    test('displays all allowed options in dropdown', async () => {
        render(<TransactionOptionDropdown {...defaultProps} />)

        const button = screen.getByRole('button', { name: 'select merge strategy' })
        fireEvent.click(button)

        await waitFor(() => {
            const menuItems = screen.getAllByRole('menuitem')
            const optionTexts = menuItems.map(item => item.textContent)
            expect(optionTexts).toContain('checkout')
            expect(optionTexts).toContain('checkin')
            expect(optionTexts).toContain('repair')
            expect(optionTexts).toContain('sale')
        })
    })

    test('filters options based on isAllowed function', async () => {
        mockIsAllowed.mockImplementation((option: string) => option !== 'sale')

        render(<TransactionOptionDropdown {...defaultProps} />)

        const button = screen.getByRole('button', { name: 'select merge strategy' })
        fireEvent.click(button)

        await waitFor(() => {
            const menuItems = screen.getAllByRole('menuitem')
            const optionTexts = menuItems.map(item => item.textContent)
            expect(optionTexts).toContain('checkout')
            expect(optionTexts).toContain('checkin')
            expect(optionTexts).toContain('repair')
            expect(optionTexts).not.toContain('sale')
        })
    })

    test('calls setTransactionType when option is selected', async () => {
        render(<TransactionOptionDropdown {...defaultProps} />)

        const button = screen.getByRole('button', { name: 'select merge strategy' })
        fireEvent.click(button)

        await waitFor(() => {
            const repairOption = screen.getByText('repair')
            fireEvent.click(repairOption)
        })

        expect(mockSetTransactionType).toHaveBeenCalledWith('repair')
    })

    test('updates selected option and closes dropdown when new option is selected', async () => {
        render(<TransactionOptionDropdown {...defaultProps} />)

        const button = screen.getByRole('button', { name: 'select merge strategy' })
        fireEvent.click(button)

        await waitFor(() => {
            const checkinOption = screen.getByText('checkin')
            fireEvent.click(checkinOption)
        })

        await waitFor(() => {
            const updatedButton = screen.getByRole('button', { name: 'select merge strategy' })
            expect(updatedButton).toHaveTextContent('checkin')
            expect(screen.queryByText('Choose a transaction type')).not.toBeInTheDocument()
        })
    })

    test('closes dropdown when clicking away', async () => {
        render(
            <div>
                <TransactionOptionDropdown {...defaultProps} />
                <div data-testid="outside">Outside element</div>
            </div>
        )

        const button = screen.getByRole('button', { name: 'select merge strategy' })
        fireEvent.click(button)

        await waitFor(() => {
            expect(screen.getByText('Choose a transaction type')).toBeInTheDocument()
        })

        const outsideElement = screen.getByTestId('outside')
        fireEvent.click(outsideElement)

        await waitFor(() => {
            expect(screen.queryByText('Choose a transaction type')).not.toBeInTheDocument()
        })
    })

    test('shows selected option as selected in dropdown', async () => {
        render(<TransactionOptionDropdown {...defaultProps} />)

        const button = screen.getByRole('button', { name: 'select merge strategy' })
        fireEvent.click(button)

        await waitFor(() => {
            const checkoutOption = screen.getByRole('menuitem', { name: 'checkout' })
            expect(checkoutOption).toHaveClass('Mui-selected')
        })
    })

    test('does not render dropdown when disabled', () => {
        render(<TransactionOptionDropdown {...defaultProps} disabled={true} />)

        const button = screen.getByRole('button', { name: 'select merge strategy' })
        fireEvent.click(button)

        // Should not show the dropdown menu when disabled
        expect(screen.queryByText('Choose a transaction type')).not.toBeInTheDocument()
    })

    test('handles case when initialOption is not in options array', () => {
        const propsWithInvalidInitial = {
            ...defaultProps,
            initialOption: 'invalid-option',
        }

        render(<TransactionOptionDropdown {...propsWithInvalidInitial} />)

        const button = screen.getByRole('button', { name: 'select merge strategy' })
        expect(button).toHaveTextContent('invalid-option')
    })

    test('uses default gray color when color index is out of bounds', () => {
        const propsWithLimitedColors = {
            ...defaultProps,
            colors: ['#4CAF50'], // Only one color but multiple options
            initialOption: 'checkin', // Will be index 1, but colors[1] doesn't exist
        }

        render(<TransactionOptionDropdown {...propsWithLimitedColors} />)

        const button = screen.getByRole('button', { name: 'select merge strategy' })
        expect(button).toHaveTextContent('checkin')
        // Check that the button doesn't have the first color since it should use gray fallback
        const computedStyle = getComputedStyle(button)
        expect(computedStyle.backgroundColor).not.toBe('rgb(76, 175, 80)') // #4CAF50 in rgb
    })

    test('calls isAllowed for each option when filtering', async () => {
        render(<TransactionOptionDropdown {...defaultProps} />)

        const button = screen.getByRole('button', { name: 'select merge strategy' })
        fireEvent.click(button)

        await waitFor(() => {
            expect(mockIsAllowed).toHaveBeenCalledWith('checkout')
            expect(mockIsAllowed).toHaveBeenCalledWith('checkin')
            expect(mockIsAllowed).toHaveBeenCalledWith('repair')
            expect(mockIsAllowed).toHaveBeenCalledWith('sale')
        })
    })
})
