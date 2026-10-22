// Draws a slide to a PNG as the page lays it out. The slide's own markup and
// the page's style sheets go into an SVG <foreignObject>, which the browser
// renders with the same CSS, and the preview's line ends are copied in so
// every line breaks at the same word. (An image library did this before, but
// it shrank every font by 0.1px while copying styles, which moved line
// breaks.)

const XHTML_NS = 'http://www.w3.org/1999/xhtml'

// The fonts are fetched once per set of families and reused for every image.
const fontCssCache = new Map<string, Promise<string>>()

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function fetchAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`フォントを読み込めませんでした（${response.status}）：${url}`)
  return readAsDataUrl(await response.blob())
}

function pageRules(): CSSRule[] {
  const rules: CSSRule[] = []
  for (const sheet of document.styleSheets) {
    // All of this page's sheets are same-origin; a cross-origin one (none
    // today) cannot be read and holds nothing the slide uses.
    let sheetRules: CSSRuleList
    try {
      sheetRules = sheet.cssRules
    } catch {
      continue
    }
    rules.push(...sheetRules)
  }
  return rules
}

function familyName(value: string): string {
  return value.trim().replace(/^["']|["']$/g, '')
}

// Every family named in the slide's font stacks. Only these faces are
// inlined: the page also loads the English site's fonts, which the slide
// never uses and which would only make each image slower to build.
function familiesUsedBy(slide: HTMLElement): Set<string> {
  const families = new Set<string>()
  for (const element of [slide, ...slide.querySelectorAll<HTMLElement>('*')]) {
    for (const name of getComputedStyle(element).fontFamily.split(',')) families.add(familyName(name))
  }
  return families
}

// An image drawn from an SVG cannot load files, so each @font-face goes in
// with its font file inlined as a data URL. The fonts still load
// asynchronously inside the image, and with the site's `swap` the image would
// first show the metric-matched fallback (Times New Roman), so `block` is used
// instead: until a font is ready its text is invisible rather than wrong, and
// drawWhenFontsSettle waits for it to appear.
async function buildFontCss(families: Set<string>): Promise<string> {
  const faces = pageRules().filter(
    (rule): rule is CSSFontFaceRule =>
      rule instanceof CSSFontFaceRule &&
      families.has(familyName(rule.style.getPropertyValue('font-family')))
  )
  const inlined = await Promise.all(
    faces.map(async (face) => {
      const base = face.parentStyleSheet?.href ?? location.href
      const urls = [...face.cssText.matchAll(/url\(["']?([^"')]+)["']?\)/g)]
      let css = face.cssText
      for (const [match, url] of urls) {
        if (url.startsWith('data:')) continue
        css = css.replace(match, `url("${await fetchAsDataUrl(new URL(url, base).href)}")`)
      }
      return css.replace(/font-display:\s*\w+/, 'font-display: block')
    })
  )
  return inlined.join('\n')
}

function fontCss(slide: HTMLElement): Promise<string> {
  const families = familiesUsedBy(slide)
  const key = [...families].sort().join('|')
  let css = fontCssCache.get(key)
  if (!css) {
    css = buildFontCss(families).catch((error) => {
      // A failed fetch must not stick: the next export tries again.
      fontCssCache.delete(key)
      throw error
    })
    fontCssCache.set(key, css)
  }
  return css
}

function pageCss(): string {
  return pageRules()
    .filter((rule) => !(rule instanceof CSSFontFaceRule))
    .map((rule) => rule.cssText)
    .join('\n')
}

// The lines of a text block as the page wrapped them: a new line starts
// wherever a character sits lower than the one before it.
function renderedLines(block: Element): string[] | null {
  const node = block.firstChild
  if (block.childNodes.length !== 1 || !(node instanceof Text)) return null
  const text = node.data
  const range = document.createRange()
  const lines: string[] = []
  let lineStart = 0
  let previousTop: number | null = null
  for (let i = 0; i < text.length; i++) {
    if (/\s/.test(text[i])) continue
    range.setStart(node, i)
    range.setEnd(node, i + 1)
    const rect = range.getClientRects()[0]
    if (!rect) continue
    if (previousTop !== null && rect.top - previousTop > rect.height / 2) {
      lines.push(text.slice(lineStart, i))
      lineStart = i
    }
    previousTop = rect.top
  }
  lines.push(text.slice(lineStart))
  return lines.map((line) => line.trim())
}

// Text drawn into an image is laid out with glyph advances rounded slightly
// differently from the page, so a line within a few pixels of the edge can
// wrap one word earlier or later. Copying the page's own line ends into the
// clone, with wrapping off, makes the image break exactly where the preview
// and the editor do.
function freezeLineBreaks(live: HTMLElement, clone: HTMLElement) {
  const liveBlocks = live.querySelectorAll('p, h1, h2')
  const cloneBlocks = clone.querySelectorAll<HTMLElement>('p, h1, h2')
  liveBlocks.forEach((block, i) => {
    const lines = renderedLines(block)
    if (!lines) return
    cloneBlocks[i].textContent = lines.join('\n')
    cloneBlocks[i].style.whiteSpace = 'pre'
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image()
  image.src = src
  return image.decode().then(() => image)
}

const FONT_SETTLE_MIN_MS = 200
const FONT_SETTLE_TIMEOUT_MS = 2500 // inside the 3s `block` period
const FONT_SETTLE_POLL_MS = 50

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// A cheap fingerprint of the canvas: enough to tell whether more text has
// appeared since the last draw.
function fingerprint(context2d: CanvasRenderingContext2D, width: number, height: number): number {
  const { data } = context2d.getImageData(0, 0, width, height)
  let hash = 0
  for (let i = 0; i < data.length; i += 4 * 97) hash = (hash * 31 + data[i] + data[i + 1] * 7) | 0
  return hash
}

// Redraws the image until its fonts have loaded: text appears as each font
// arrives, so two identical draws after a short minimum mean nothing is still
// on its way. Fails loudly rather than return an image with missing text.
async function drawWhenFontsSettle(
  image: HTMLImageElement,
  context2d: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const start = performance.now()
  let previous: number | null = null
  for (;;) {
    context2d.clearRect(0, 0, width, height)
    context2d.drawImage(image, 0, 0, width, height)
    const current = fingerprint(context2d, width, height)
    const elapsed = performance.now() - start
    if (elapsed >= FONT_SETTLE_MIN_MS && current === previous) return
    if (elapsed >= FONT_SETTLE_TIMEOUT_MS) {
      throw new Error('フォントの読み込みが間に合いませんでした。もう一度書き出してください')
    }
    previous = current
    await sleep(FONT_SETTLE_POLL_MS)
  }
}

// `context` is the element the slide sits in on the page (the tool's root).
// Its class and language are reproduced around the slide, so the slide
// inherits the same CSS variables and fonts as in the preview.
export async function renderSlidePng(
  slide: HTMLElement,
  context: HTMLElement,
  width: number,
  height: number
): Promise<string> {
  const root = document.documentElement
  const outer = document.createElementNS(XHTML_NS, 'div')
  outer.setAttribute('class', root.className)
  outer.setAttribute('lang', root.lang)
  outer.setAttribute('dir', root.dir)
  const inner = document.createElementNS(XHTML_NS, 'div')
  inner.setAttribute('class', context.className)
  inner.setAttribute('lang', context.lang)
  inner.setAttribute('dir', context.dir)
  // Keep the context's inherited type and variables but none of its layout.
  inner.setAttribute('style', `display:block;margin:0;padding:0;width:${width}px;height:${height}px`)
  const clone = slide.cloneNode(true) as HTMLElement
  freezeLineBreaks(slide, clone)
  inner.appendChild(clone)
  outer.appendChild(inner)

  // Serialized as escaped text, which the SVG's XML parser turns back into
  // the original CSS.
  const style = document.createElementNS(XHTML_NS, 'style')
  style.textContent = `${await fontCss(slide)}\n${pageCss()}`
  outer.prepend(style)

  const markup = new XMLSerializer().serializeToString(outer)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`
  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context2d = canvas.getContext('2d', { willReadFrequently: true })
  if (!context2d) throw new Error('canvas に描画できませんでした')
  await drawWhenFontsSettle(image, context2d, width, height)
  return canvas.toDataURL('image/png')
}
