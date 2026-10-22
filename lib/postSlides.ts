// Turns pasted article text into Instagram carousel slides. The author decides
// where each image ends by placing "---" lines in the text (splitAtBreaks);
// packSlides only proposes those positions, and slidesToText writes the
// proposal back into the text for the author to adjust. Kept free of DOM code:
// whether a set of blocks fits on one slide is measured by the caller and
// passed in, so the rules can be tested in Node.

export type Block =
  | { kind: 'title'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }

export type Slide = {
  blocks: Block[]
  // The text is taller than the slide. Nothing is dropped; the tool flags the
  // slide so the author moves a "---" up.
  overflows: boolean
}

export type Token = Block | { kind: 'break' }

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/
const FRONTMATTER_TITLE = /^title:\s*["']?(.*?)["']?\s*$/m

// Reads the text the way the editor shows it: a blank line ends a paragraph,
// and a plain line break stays a line break inside the paragraph (kept as
// "\n"), so the image has the same tight and open spacing the author typed.
// Text with no blank lines at all (a Google Docs paste puts one paragraph per
// line) is read as one paragraph per line instead. An .mdx file's
// frontmatter title, "## " headings and "---" section breaks are read too.
export function parsePost(text: string): Token[] {
  const tokens: Token[] = []
  let body = text

  const frontmatter = body.match(FRONTMATTER)
  if (frontmatter) {
    const title = frontmatter[1].match(FRONTMATTER_TITLE)?.[1]
    if (title) tokens.push({ kind: 'title', text: title })
    body = body.slice(frontmatter[0].length)
  }

  const lines = body.split(/\r?\n/).map((line) => line.trim())
  const first = lines.findIndex(Boolean)
  const last = lines.findLastIndex(Boolean)
  const blankLinesSeparate = lines.slice(first, last).some((line) => !line)

  let paragraph: string[] = []
  const endParagraph = () => {
    if (paragraph.length > 0) tokens.push({ kind: 'paragraph', text: paragraph.join('\n') })
    paragraph = []
  }

  for (const line of lines) {
    if (!line) {
      endParagraph()
    } else if (/^(-{3,}|\*{3,}|(\* ){2,}\*)$/.test(line)) {
      endParagraph()
      tokens.push({ kind: 'break' })
    } else if (line.startsWith('# ')) {
      endParagraph()
      tokens.push({ kind: 'title', text: line.slice(2).trim() })
    } else if (/^#{2,6} /.test(line)) {
      endParagraph()
      tokens.push({ kind: 'heading', text: line.replace(/^#+ /, '') })
    } else {
      paragraph.push(line)
      if (!blankLinesSeparate) endParagraph()
    }
  }
  endParagraph()
  return tokens
}

// Splits after sentence-ending punctuation (Latin and Arabic question mark),
// keeping the punctuation with its sentence. The Arabic comma is not an end.
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?؟…])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

// Proposes where the images should end. Greedy packing: fill each slide until the next block no longer fits. The
// title opens the cover and the lead (the paragraphs before the first heading)
// joins it when there is room. Every heading opens a new slide, so each section
// starts at the top of an image, and "---" forces a new slide too. A paragraph
// that cannot fit on an empty slide is split into sentences.
export function packSlides(tokens: Token[], fits: (blocks: Block[]) => boolean): Slide[] {
  const slides: Slide[] = []
  let current: Block[] = []

  const flush = (overflows = false) => {
    if (current.length > 0) slides.push({ blocks: current, overflows })
    current = []
  }

  const place = (block: Block): boolean => {
    if (fits([...current, block])) {
      current.push(block)
      return true
    }
    // A slide holding only a heading stays put: the block is split instead.
    const onlyHeading = current.length === 1 && current[0].kind === 'heading'
    if (current.length > 0 && !onlyHeading) {
      flush()
      if (fits([...current, block])) {
        current.push(block)
        return true
      }
    }
    return false
  }

  for (const token of tokens) {
    if (token.kind === 'break') {
      flush()
      continue
    }
    if (token.kind === 'title' || token.kind === 'heading') {
      flush()
      current.push(token)
      if (!fits(current)) flush(true)
      continue
    }
    if (place(token)) continue

    // Too long even for an empty slide (or one holding only its heading).
    for (const sentence of splitSentences(token.text)) {
      const piece: Block = { kind: 'paragraph', text: sentence }
      if (place(piece)) continue
      current.push(piece)
      flush(true)
    }
  }
  flush()
  return slides
}

// The author's own split: a new slide at every "---" and nowhere else.
export function splitAtBreaks(tokens: Token[], fits: (blocks: Block[]) => boolean): Slide[] {
  const slides: Slide[] = []
  let current: Block[] = []

  const flush = () => {
    if (current.length > 0) slides.push({ blocks: current, overflows: !fits(current) })
    current = []
  }

  for (const token of tokens) {
    if (token.kind === 'break') flush()
    else current.push(token)
  }
  flush()
  return slides
}

function blockToLine(block: Block): string {
  if (block.kind === 'title') return `# ${block.text}`
  if (block.kind === 'heading') return `## ${block.text}`
  return block.text
}

// Writes slides back as text with a "---" between them, so a proposed split
// becomes editable.
export function slidesToText(slides: Slide[]): string {
  const segments = slides.map((slide) => slide.blocks.map(blockToLine).join('\n\n'))
  return `${segments.join('\n\n---\n\n')}\n`
}
