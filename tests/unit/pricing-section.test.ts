import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PricingSection } from '@/features/billing/pricing-section'

describe('PricingSection', () => {
  it('shows confirmed prices without out-of-MVP promises', () => {
    render(createElement(PricingSection))

    expect(screen.getByText('R$ 29,90')).toBeInTheDocument()
    expect(screen.getByText('R$ 287,00')).toBeInTheDocument()
    expect(screen.getAllByText('Cartão ou PIX')).toHaveLength(2)

    const text = document.body.textContent?.toLowerCase() ?? ''
    expect(text).not.toContain('simulado')
    expect(text).not.toContain('offline')
    expect(text).not.toContain('20.000')
    expect(text).not.toContain('20,000')
    expect(text).not.toContain('ranking')
    expect(text).not.toContain('flashcard')
    expect(text).not.toContain('aula')
  })
})
