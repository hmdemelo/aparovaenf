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
    <section aria-labelledby="authors-heading" className="mx-auto max-w-xl">
      <h2
        id="authors-heading"
        className="mb-4 text-center text-xl font-bold text-slate-900"
      >
        Comentários de quem já passou
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {authors.map((author) => (
          <li
            key={author.id}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <p className="font-semibold text-slate-800">{author.display_name}</p>
            {author.short_bio && (
              <p className="mt-1 text-sm text-slate-500">{author.short_bio}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
