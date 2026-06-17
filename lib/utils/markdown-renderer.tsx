import React from 'react'

/**
 * Parses a single line of text for inline formatting tokens.
 * Matches:
 * - **bold** -> <strong>
 * - *italic* -> <em>
 * - <u>underline</u> -> <u>
 * - ~~strikethrough~~ -> <del>
 * 
 * Secure by design: maps to static React elements instead of utilizing dangerouslySetInnerHTML.
 */
function parseLine(text: string): React.ReactNode[] {
  // Regex splitting by bold (**), italic (*), underline (<u>), and strikethrough (~~) tags
  const regex = /(\*\*.*?\*\*|\*[^*]+?\*|<u>.*?<\/u>|~~.*?~~)/g
  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      return <u key={index}>{part.slice(3, -4)}</u>
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return <del key={index}>{part.slice(2, -2)}</del>
    }
    return part
  })
}

/**
 * Renders text containing simple markdown-like formatting elements safely.
 * Inserts <br /> tags for line breaks.
 */
export function RichText({ text }: { text: string | null | undefined }) {
  if (!text) return null

  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, index) => (
        <React.Fragment key={index}>
          {index > 0 && <br />}
          {parseLine(line)}
        </React.Fragment>
      ))}
    </>
  )
}
