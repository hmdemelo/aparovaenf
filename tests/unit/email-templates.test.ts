import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  renderWelcomeEmail,
  renderPaymentFailedEmail,
  renderSubscriptionExpiredEmail,
} from '@/lib/email/templates'
import {
  sendWelcomeEmail,
  sendPaymentFailedEmail,
  sendSubscriptionExpiredEmail,
} from '@/lib/email/service'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'

// Create a spy for Resend send method
const mockSend = vi.fn().mockResolvedValue({ data: { id: 'msg_123' }, error: null })

// Mock resend singleton helper
vi.mock('@/lib/email/resend', () => {
  return {
    getResend: () => ({
      emails: {
        send: mockSend,
      },
    }),
    FROM_ADDRESS: 'AprovaENF <noreply@aprovaenf.com>',
  }
})

describe('Email Templates rendering (pt-BR)', () => {
  const name = 'Dr. Ana Carolina'
  const appUrl = 'https://aprovaenf.com'

  it('renders a beautiful Welcome email with core parameters', () => {
    const planName = 'Anual'
    const result = renderWelcomeEmail(name, planName, appUrl)

    expect(result.subject).toContain('AprovaENF Pro')
    expect(result.html).toContain('Olá, <strong>Dr. Ana Carolina</strong>')
    expect(result.html).toContain('plano <strong>Anual</strong>')
    expect(result.html).toContain('href="https://aprovaenf.com/feed"')
    expect(result.text).toContain('Feed de Questões Infinito')
  })

  it('renders a Payment Failed warning email', () => {
    const billingUrl = 'https://aprovaenf.com/assinar'
    const result = renderPaymentFailedEmail(name, billingUrl)

    expect(result.subject).toContain('problema com seu pagamento')
    expect(result.html).toContain('Olá, <strong>Dr. Ana Carolina</strong>')
    expect(result.html).toContain('problema com a cobrança')
    expect(result.html).toContain('href="https://aprovaenf.com/assinar"')
    expect(result.text).toContain('regularizar a cobrança')
  })

  it('renders a Subscription Expired/Canceled notification', () => {
    const result = renderSubscriptionExpiredEmail(name, appUrl)

    expect(result.subject).toContain('assinatura do AprovaENF Pro foi encerrada')
    expect(result.html).toContain('Olá, <strong>Dr. Ana Carolina</strong>')
    expect(result.html).toContain('plano gratuito')
    expect(result.html).toContain('href="https://aprovaenf.com/assinar"')
    expect(result.text).toContain('limite de 5 questões diárias')
  })
})

describe('Email Service dispatch logic', () => {
  beforeEach(() => {
    mockSend.mockClear()
  })

  const mockDbSelect = vi.fn()
  const mockDbEq = vi.fn()
  const mockDbMaybeSingle = vi.fn()

  const mockDb = {
    from: () => ({
      select: mockDbSelect.mockReturnValue({
        eq: mockDbEq.mockReturnValue({
          maybeSingle: mockDbMaybeSingle,
        }),
      }),
    }),
  } as unknown as SupabaseClient<Database>

  it('sends welcome email successfully when profile exists', async () => {
    mockDbMaybeSingle.mockResolvedValue({
      data: { email: 'ana@example.com', name: 'Ana Carolina' },
      error: null,
    })

    const response = await sendWelcomeEmail(mockDb, 'user-123', 'Anual', 'https://aprovaenf.com')

    expect(response.ok).toBe(true)
    expect(mockDbSelect).toHaveBeenCalledWith('email, name')
    expect(mockDbEq).toHaveBeenCalledWith('id', 'user-123')
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@example.com',
        subject: expect.stringContaining('AprovaENF Pro está liberado'),
        html: expect.stringContaining('plano <strong>Anual</strong>'),
      }),
    )
  })

  it('sends payment failed email successfully when profile exists', async () => {
    mockDbMaybeSingle.mockResolvedValue({
      data: { email: 'ana@example.com', name: 'Ana Carolina' },
      error: null,
    })

    const response = await sendPaymentFailedEmail(mockDb, 'user-123', 'https://billing-portal.url')

    expect(response.ok).toBe(true)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@example.com',
        subject: expect.stringContaining('problema com seu pagamento'),
        html: expect.stringContaining('https://billing-portal.url'),
      }),
    )
  })

  it('sends subscription expired email successfully when profile exists', async () => {
    mockDbMaybeSingle.mockResolvedValue({
      data: { email: 'ana@example.com', name: 'Ana Carolina' },
      error: null,
    })

    const response = await sendSubscriptionExpiredEmail(mockDb, 'user-123', 'https://aprovaenf.com')

    expect(response.ok).toBe(true)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@example.com',
        subject: expect.stringContaining('AprovaENF Pro foi encerrada'),
        html: expect.stringContaining('plano gratuito'),
      }),
    )
  })

  it('handles database errors gracefully', async () => {
    mockDbMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'DB Connection Error' },
    })

    const response = await sendWelcomeEmail(mockDb, 'user-123', 'Mensal', 'https://aprovaenf.com')

    expect(response.ok).toBe(false)
    expect(response.error).toContain('User profile or email not found')
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('handles resend provider failures gracefully', async () => {
    mockDbMaybeSingle.mockResolvedValue({
      data: { email: 'ana@example.com', name: 'Ana Carolina' },
      error: null,
    })
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: 'Resend API rate limit exceeded' },
    })

    const response = await sendWelcomeEmail(mockDb, 'user-123', 'Mensal', 'https://aprovaenf.com')

    expect(response.ok).toBe(false)
    expect(response.error).toBe('Resend API rate limit exceeded')
  })
})
