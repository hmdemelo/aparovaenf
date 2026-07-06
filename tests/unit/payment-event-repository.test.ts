import { describe, expect, it, vi } from 'vitest'
import { createPaymentEventRepository } from '@/features/billing/payment-event-repository'

describe('payment event repository', () => {
  it('records Asaas as the provider for Asaas webhook events', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'event-row',
        provider: 'asaas',
        provider_event_id: 'evt_123',
        processing_status: 'received',
      },
      error: null,
    })
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    const db = {
      from: vi.fn(() => ({ insert })),
    }

    const repository = createPaymentEventRepository(db as never)
    const result = await repository.recordReceived({
      providerEventId: 'evt_123',
      eventType: 'checkout.session.completed',
      payload: { id: 'evt_123' },
    })

    expect(result.ok).toBe(true)
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'asaas',
        provider_event_id: 'evt_123',
      }),
    )
  })
})
