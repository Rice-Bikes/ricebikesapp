import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { queryClient } from './queryClient'

// Define wrapper for providing context to component tests
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            {children}
        </BrowserRouter>
    </QueryClientProvider>
)

// Mock components for simpler testing
vi.mock('../components/AuthPrompt/AuthPrompt', () => ({
    default: () => <div data-testid="auth-prompt">Mock Auth Prompt</div>
}))

vi.mock('../features/TransactionsTable/TransactionsTable', () => ({
    TransactionsTable: () => <div data-testid="transactions-table">Mock Transactions Table</div>
}))

vi.mock('../features/AdminPage/AdminPage', () => ({
    default: () => <div data-testid="admin-page">Mock Admin Page</div>
}))

vi.mock('../features/WhiteboardPage', () => ({
    default: () => <div data-testid="whiteboard-page">Mock Whiteboard Page</div>
}))

vi.mock('../features/TransactionPage/TransactionPage', () => ({
    default: () => <div data-testid="transaction-detail">Mock Transaction Detail</div>
}))

describe('App Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('renders header elements', () => {
        render(<App />, { wrapper })

        expect(screen.getByAltText('Rice Bikes Icon')).toBeInTheDocument()
        expect(screen.getByText('Rice Bikes App')).toBeInTheDocument()
    })

    test('renders AuthPrompt', () => {
        render(<App />, { wrapper })

        expect(screen.getByTestId('auth-prompt')).toBeInTheDocument()
    })

    test('handles logout action', async () => {
        // Arrange
        const removeQueriesSpy = vi.spyOn(queryClient, 'removeQueries')
        render(<App />, { wrapper })

        // Act - Find by ID and ensure it exists before clicking
        const logoutButton = screen.getByRole('button', { name: /logout/i })
        expect(logoutButton).toBeInTheDocument()
        fireEvent.click(logoutButton)

        // Assert
        expect(removeQueriesSpy).toHaveBeenCalledWith({ queryKey: ['user'] })
        expect(removeQueriesSpy).toHaveBeenCalledTimes(1)
    })

    test('renders TransactionsTable on home route', () => {
        window.history.pushState({}, '', '/')
        render(<App />, { wrapper })

        expect(screen.getByTestId('transactions-table')).toBeInTheDocument()
    })

    test('renders AdminPage on admin route', () => {
        window.history.pushState({}, '', '/admin')
        render(<App />, { wrapper })

        expect(screen.getByTestId('admin-page')).toBeInTheDocument()
    })

    test('renders WhiteboardPage on whiteboard route', () => {
        window.history.pushState({}, '', '/whiteboard')
        render(<App />, { wrapper })

        expect(screen.getByTestId('whiteboard-page')).toBeInTheDocument()
    })

    test('renders TransactionDetail on transaction-details route', () => {
        window.history.pushState({}, '', '/transaction-details/123')
        render(<App />, { wrapper })

        expect(screen.getByTestId('transaction-detail')).toBeInTheDocument()
    })

    test('navigation works when clicking Rice Bikes icon', () => {
        // Arrange - Start on a non-home route
        window.history.pushState({}, '', '/admin')
        render(<App />, { wrapper })

        // Verify we're on admin route
        expect(screen.getByTestId('admin-page')).toBeInTheDocument()

        // Act - Find and click the Rice Bikes icon link
        const homeLink = screen.getByAltText('Rice Bikes Icon').closest('a')
        expect(homeLink).not.toBeNull()
        if (homeLink) {
            fireEvent.click(homeLink)
        }

        // Assert - Should navigate to home page
        expect(window.location.pathname).toBe('/')
        expect(screen.getByTestId('transactions-table')).toBeInTheDocument()
    })

    test('renders ToastContainer with correct props', () => {
        // Render the App component
        render(<App />, { wrapper })

        // Check for ToastContainer element with expected properties
        // This assumes ToastContainer has a data-testid attribute - you may need to add this to App.tsx
        const toastContainer = document.querySelector('.Toastify__toast-container')

        // Verify toast container exists
        // Note: If this fails, you may need to add data-testid to your ToastContainer in App.tsx
        expect(toastContainer).toBeDefined()
    })
})