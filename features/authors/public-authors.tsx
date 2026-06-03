import { UserRoundCheck } from 'lucide-react'

type PublicAuthor = {
  id: string
  display_name: string
  short_bio: string | null
}

/**
 * Trust section presenting the specialist authors. Receives already-fetched
 * public author profiles (the landing page loads them server-side).
 */
export function PublicAuthors({ authors }: { authors: PublicAuthor[] }) {
  if (authors.length === 0) return null

  return (
    <section aria-labelledby="authors-heading" className="mx-auto max-w-3xl">
      <h2
        id="authors-heading"
        className="font-display mb-2 text-center text-[26px] font-semibold text-[var(--ink)]"
      >
        Comentários de quem já passou
      </h2>
      <p className="mx-auto mb-6 max-w-xl text-center text-[15px] leading-relaxed text-[var(--muted)]">
        Questões e comentários preparados por profissionais que conhecem a rotina
        dos concursos da saúde.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {authors.map((author) => (
          <li key={author.id} className="aprova-paper-card p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(160,243,212,0.42)] text-[var(--teal)]">
                <UserRoundCheck size={19} />
              </span>
              <div>
                <p className="font-semibold text-[var(--ink)]">
                  {author.display_name}
                </p>
                {author.short_bio && (
                  <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                    {author.short_bio}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
