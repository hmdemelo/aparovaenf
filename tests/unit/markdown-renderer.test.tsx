import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RichText } from '@/lib/utils/markdown-renderer'

describe('RichText Markdown Renderer', () => {
  it('renders plain text without styles', () => {
    render(<RichText text="Hello World" />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders bold formatting correctly', () => {
    const { container } = render(<RichText text="This is **bold** text" />)
    const strong = container.querySelector('strong')
    expect(strong).toBeInTheDocument()
    expect(strong?.textContent).toBe('bold')
    expect(container.textContent).toBe('This is bold text')
  })

  it('renders italic formatting correctly', () => {
    const { container } = render(<RichText text="This is *italic* text" />)
    const em = container.querySelector('em')
    expect(em).toBeInTheDocument()
    expect(em?.textContent).toBe('italic')
    expect(container.textContent).toBe('This is italic text')
  })

  it('renders underline formatting correctly', () => {
    const { container } = render(<RichText text="This is <u>underline</u> text" />)
    const u = container.querySelector('u')
    expect(u).toBeInTheDocument()
    expect(u?.textContent).toBe('underline')
    expect(container.textContent).toBe('This is underline text')
  })

  it('renders strikethrough formatting correctly', () => {
    const { container } = render(<RichText text="This is ~~strikethrough~~ text" />)
    const del = container.querySelector('del')
    expect(del).toBeInTheDocument()
    expect(del?.textContent).toBe('strikethrough')
    expect(container.textContent).toBe('This is strikethrough text')
  })

  it('handles multiple formats in a single line', () => {
    const { container } = render(
      <RichText text="Combine **bold**, *italic* and <u>underline</u>." />
    )
    expect(container.querySelector('strong')?.textContent).toBe('bold')
    expect(container.querySelector('em')?.textContent).toBe('italic')
    expect(container.querySelector('u')?.textContent).toBe('underline')
  })

  it('handles newlines with <br /> tags', () => {
    const { container } = render(<RichText text={"Line one\nLine two"} />)
    expect(container.querySelector('br')).toBeInTheDocument()
    expect(container.textContent).toContain('Line oneLine two')
  })

  it('is safe against XSS script tag injection', () => {
    const testScript = 'Before <script>alert("XSS")</script> After'
    const { container } = render(<RichText text={testScript} />)
    
    // Check that no script tag was parsed into an active DOM element
    const scripts = container.querySelectorAll('script')
    expect(scripts.length).toBe(0)
    
    // Check that it rendered as a safe text string
    expect(container.textContent).toBe(testScript)
  })

  it('is safe against HTML attribute injections', () => {
    const testInjection = 'Click <a href="javascript:alert(1)">here</a> or <img src="x" onerror="alert(2)" />'
    const { container } = render(<RichText text={testInjection} />)
    
    // Check that no HTML tags were created in the DOM
    expect(container.querySelectorAll('a').length).toBe(0)
    expect(container.querySelectorAll('img').length).toBe(0)
    expect(container.textContent).toBe(testInjection)
  })
})
