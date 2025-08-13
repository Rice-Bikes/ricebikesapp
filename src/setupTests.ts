import '@testing-library/jest-dom'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Create root element for testing
beforeEach(() => {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
})

// Clean up after each test
afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
})
