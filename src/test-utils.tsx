import { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './app/queryClient'

export const mockUser = {
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

export const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}
