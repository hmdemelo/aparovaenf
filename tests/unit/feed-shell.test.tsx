import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FeedShell } from '@/features/student-feed/feed-shell'
import type { FeedQuestionDto } from '@/features/student-feed/types'

// The router object must be referentially stable across renders (like the real
// next/navigation router); a fresh object per render would retrigger loadNext.
const navigation = vi.hoisted(() => {
  const push = (...args: unknown[]) => void args
  return { router: { push, refresh: () => {} } }
})

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
}))

function makeQuestion(id: string, statement: string): FeedQuestionDto {
  return {
    id,
    statement,
    difficulty: 'facil',
    career: { id: 'c1', name: 'Enfermeiro(a)', slug: 'enfermeiro-a' },
    subject: { name: 'Fundamentos' },
    board: null,
    source: null,
    annulled: false,
    answerKeyChanged: false,
    alternatives: [
      { id: `${id}-a`, label: 'A', text: 'Alternativa A', position: 1 },
      { id: `${id}-b`, label: 'B', text: 'Alternativa B', position: 2 },
    ],
  }
}

const trialStatus = {
  answered_after_signup: 0,
  remaining_free: 3,
  signup_required: false,
  paywall_required: false,
  subscription_active: false,
  can_answer: true,
}

type PendingRequest = { url: string; resolve: (value: unknown) => void }

describe('FeedShell', () => {
  let requests: PendingRequest[]

  beforeEach(() => {
    requests = []
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (url: string) =>
          new Promise((resolve) => {
            requests.push({ url: String(url), resolve })
          }),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function respond(request: PendingRequest, question: FeedQuestionDto) {
    request.resolve({
      json: async () => ({
        success: true,
        data: { question, trial_status: trialStatus },
      }),
    })
  }

  it('ignores the stale response when filters change during a load', async () => {
    render(
      <FeedShell
        careerSlug="enfermeiro-a"
        filterOptions={{
          subjects: [{ id: 's1', name: 'Fundamentos' }],
          boards: [],
          tags: [],
        }}
      />,
    )

    // First load is in flight (StrictMode may fire it more than once); switch
    // the subject filter before any response arrives.
    await waitFor(() => expect(requests.length).toBeGreaterThan(0))
    fireEvent.click(screen.getByTestId('feed-filters-toggle'))
    const select = await screen.findByTestId('filter-subject')
    fireEvent.change(select, { target: { value: 's1' } })

    // The filtered request is identified by its query string.
    await waitFor(() =>
      expect(requests.some((r) => r.url.includes('subject=s1'))).toBe(true),
    )
    const fresh = requests.find((r) => r.url.includes('subject=s1'))!
    const stale = requests.filter((r) => !r.url.includes('subject=s1'))

    // The newer request resolves first, then the stale ones arrive late.
    respond(fresh, makeQuestion('q2', 'Questão filtrada'))
    expect(await screen.findByText('Questão filtrada')).toBeInTheDocument()

    for (const request of stale) {
      respond(request, makeQuestion('q1', 'Questão antiga'))
    }
    await waitFor(() => {
      expect(screen.queryByText('Questão antiga')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Questão filtrada')).toBeInTheDocument()
  })

  it('shows the remaining free questions for a non-subscriber', async () => {
    render(<FeedShell careerSlug="enfermeiro-a" />)

    await waitFor(() => expect(requests.length).toBeGreaterThan(0))
    respond(requests[requests.length - 1], makeQuestion('q1', 'Questão um'))

    const counter = await screen.findByTestId('trial-counter')
    expect(counter).toHaveTextContent('3 questões grátis restantes')
  })

  it('hides the trial counter for subscribers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        json: async () => ({
          success: true,
          data: {
            question: makeQuestion('q1', 'Questão um'),
            trial_status: {
              ...trialStatus,
              remaining_free: null,
              subscription_active: true,
            },
          },
        }),
      })),
    )

    render(<FeedShell careerSlug="enfermeiro-a" />)

    expect(await screen.findByText('Questão um')).toBeInTheDocument()
    expect(screen.queryByTestId('trial-counter')).not.toBeInTheDocument()
  })
})
