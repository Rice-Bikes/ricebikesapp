import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import HeaderItem from './HeaderItem'
import { AllTheProviders } from '../../test-utils'

describe('HeaderItem Component', () => {
    test('renders as a paper component with default styling', () => {
        render(
            <HeaderItem>Test Content</HeaderItem>,
            { wrapper: AllTheProviders }
        )

        const headerItem = screen.getByText('Test Content')
        expect(headerItem).toBeInTheDocument()
        expect(headerItem).toHaveClass('MuiPaper-root')
    })

    test('displays children content correctly', () => {
        const testContent = 'This is a test header item'
        render(
            <HeaderItem>{testContent}</HeaderItem>,
            { wrapper: AllTheProviders }
        )

        expect(screen.getByText(testContent)).toBeInTheDocument()
    })

    test('renders with complex children content', () => {
        render(
            <HeaderItem>
                <div>
                    <span>Nested Content</span>
                    <p>Paragraph content</p>
                </div>
            </HeaderItem>,
            { wrapper: AllTheProviders }
        )

        expect(screen.getByText('Nested Content')).toBeInTheDocument()
        expect(screen.getByText('Paragraph content')).toBeInTheDocument()
    })

    test('can accept additional props', () => {
        render(
            <HeaderItem data-testid="header-item" elevation={3}>
                Test Content
            </HeaderItem>,
            { wrapper: AllTheProviders }
        )

        const headerItem = screen.getByTestId('header-item')
        expect(headerItem).toBeInTheDocument()
        expect(headerItem).toHaveClass('MuiPaper-elevation3')
    })

    test('applies center text alignment styles', () => {
        render(
            <HeaderItem>Centered Text</HeaderItem>,
            { wrapper: AllTheProviders }
        )

        const headerItem = screen.getByText('Centered Text')
        expect(headerItem).toHaveStyle('text-align: center')
    })
})
