import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom'
import AuthPrompt from './AuthPrompt'
import { queryClient } from '../../app/queryClient'
import { act } from '@testing-library/react'

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn()
  }
}))

// Mock the useQuery hook
const mockUseQuery = vi.fn()
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: (query: unknown) => mockUseQuery(query),
  }
})

// Mock useNavigate hook
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock environment variables  
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_DEBUG: true
  },
  writable: true
})

const mockUser = {
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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
)

describe('AuthPrompt Component', () => {
  const mockSetUser = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    vi.useFakeTimers()

    // Mock useQuery to return no user initially
    mockUseQuery.mockReturnValue({
      data: null,
      error: null,
      status: 'pending',
      isLoading: true,
      isError: false,
      isSuccess: false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('renders dialog with netId input field', () => {
    render(<AuthPrompt setUser={mockSetUser} />, { wrapper })

    expect(screen.getByText('Enter your NetID')).toBeInTheDocument()
    expect(screen.getByLabelText('NetID')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })

  test('shows initial timer value', () => {
    render(<AuthPrompt setUser={mockSetUser} />, { wrapper })

    expect(screen.getByText('Session expires in 7:00')).toBeInTheDocument()
  })

  test('updates timer correctly', async () => {
    render(<AuthPrompt setUser={mockSetUser} />, { wrapper })

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByText('Session expires in 6:59')).toBeInTheDocument()
  })

  test('resets session when timer expires', async () => {
    render(<AuthPrompt setUser={mockSetUser} />, { wrapper })
    const removeQueriesSpy = vi.spyOn(queryClient, 'removeQueries')

    await act(async () => {
      vi.advanceTimersByTime(7 * 60 * 1000) // Advance to end of timer
    })

    expect(removeQueriesSpy).toHaveBeenCalledWith({ queryKey: ['user'] })
  })

  test('handles successful user login', async () => {
    // Start with no data to ensure dialog opens
    mockUseQuery.mockReturnValue({
      data: null,
      error: null,
      status: 'pending',
      isLoading: false,
      isError: false,
      isSuccess: false,
    })

    render(<AuthPrompt setUser={mockSetUser} />, { wrapper })

    // Initially, dialog should be open with no user data
    expect(screen.getByText('Enter your NetID')).toBeInTheDocument()
    expect(screen.getByLabelText('NetID')).toBeInTheDocument()

    const input = screen.getByLabelText('NetID')
    
    // Enter netId value
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test123' } })
    })

    // Click submit - this will set the netId state and trigger the query
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    })

    // Verify that the input was cleared (which happens in handleSubmit)
    expect(input).toHaveValue('')
  })

  test('displays error message for invalid netId', async () => {
    // Start with an error to show the error state
    mockUseQuery.mockReturnValue({
      data: null,
      error: new Error('Invalid netId'),
      status: 'error',
      isLoading: false,
      isError: true,
      isSuccess: false,
    })

    render(<AuthPrompt setUser={mockSetUser} />, { wrapper })

    // Dialog should be open due to error
    expect(screen.getByText('Enter your NetID')).toBeInTheDocument()
    
    // Check for error message in helper text
    expect(screen.getByText('Invalid netId')).toBeInTheDocument()
  })

  test('handles Enter key press', async () => {
    // Start with no data to ensure dialog opens
    mockUseQuery.mockReturnValue({
      data: null,
      error: null,
      status: 'pending',
      isLoading: false,
      isError: false,
      isSuccess: false,
    })

    render(<AuthPrompt setUser={mockSetUser} />, { wrapper })

    expect(screen.getByLabelText('NetID')).toBeInTheDocument()

    const input = screen.getByLabelText('NetID')
    
    // Enter netId value
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test123' } })
    })

    // Press Enter key - this should trigger handleSubmit
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' })
    })

    // Verify that the input was cleared (which happens in handleSubmit)
    expect(input).toHaveValue('')
  })

  test('shows admin button for users with permissions', async () => {
    // Start with successful user data to show logged-in state
    mockUseQuery.mockReturnValue({
      data: mockUser,
      error: null,
      status: 'success',
      isLoading: false,
      isError: false,
      isSuccess: true,
    })

    render(<AuthPrompt setUser={mockSetUser} />, { wrapper })
    
    // The admin button should be visible immediately since we have user data
    expect(screen.getByText('Admin Page')).toBeInTheDocument()
  })

  test('updates current user display', async () => {
    // Start with successful user data to show logged-in state
    mockUseQuery.mockReturnValue({
      data: mockUser,
      error: null,
      status: 'success',
      isLoading: false,
      isError: false,
      isSuccess: true,
    })

    render(<AuthPrompt setUser={mockSetUser} />, { wrapper })

    // The current user display should be visible immediately
    expect(screen.getByText('Current User: Test User')).toBeInTheDocument()
  })

  test('handles logout action', async () => {
    // Start with successful user data to show logged-in state
    mockUseQuery.mockReturnValue({
      data: mockUser,
      error: null,
      status: 'success',
      isLoading: false,
      isError: false,
      isSuccess: true,
    })

    render(<AuthPrompt setUser={mockSetUser} />, { wrapper })

    const removeQueriesSpy = vi.spyOn(queryClient, 'removeQueries')
    
    // The button should be visible immediately
    const currentUserButton = screen.getByText('Current User: Test User')
    expect(currentUserButton).toBeInTheDocument()

    // Click the button
    fireEvent.click(currentUserButton)

    // Verify the query client was called
    expect(removeQueriesSpy).toHaveBeenCalledWith({ queryKey: ['user'] })
  })
})
