import type { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { createSupabaseServiceClient } from '@/lib/db/server'

export const dynamic = 'force-dynamic'

const MAX_SUGGESTIONS = 10

// GET /api/tags?q=<term> — tag autocomplete suggestions for the question editor.
// Tags are public catalog data (RLS: readable by everyone). An empty query
// returns the most recent tags so the field can show options on focus.
export async function GET(request: NextRequest) {
  const term = (request.nextUrl.searchParams.get('q') ?? '').trim()
  const db = createSupabaseServiceClient()

  let query = db.from('tags').select('id, name, slug')
  if (term) {
    query = query.ilike('name', `%${term}%`)
  }
  const { data } = await query
    .order('name', { ascending: true })
    .limit(MAX_SUGGESTIONS)

  return ok({ tags: data ?? [] })
}
