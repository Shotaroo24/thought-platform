'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  packSlides,
  parsePost,
  slidesToText,
  splitAtBreaks,
  type Block,
  type Slide,
} from '@/lib/postSlides'
import { keepPhrasesTogether } from '@/lib/typography'
import { renderSlidePng } from './renderSlide'
import styles from './ig.module.css'

const SLIDE_WIDTH = 1080
const SLIDE_HEIGHT = 1350

const DRAFT_KEY = 'ig-tool-draft'
// Instagram's carousel limit; a longer article goes out as two posts.
const MAX_SLIDES_PER_POST = 20

const arabicDigits = new Intl.NumberFormat('ar-u-nu-arab')

// The title is set like any other section heading: the cover reads as the
// first page of the article, not as a poster.
function blockClass(block: Block): string {
  if (block.kind === 'title' || block.kind === 'heading') return styles.heading
  return styles.paragraph
}

function blockTag(block: Block): 'h1' | 'h2' | 'p' {
  if (block.kind === 'title') return 'h1'
  if (block.kind === 'heading') return 'h2'
  return 'p'
}

// The editor holds the text with the same no-break spaces the slides get, so
// "Claude Code" or "عن طريق" wrap as one unit in both and the editor's line
// ends match the image's. Each replaced space stays one character, so the
// caret position is unaffected.
function withKeptPhrases(text: string): string {
  return keepPhrasesTogether(text, 'ar')
}

function display(block: Block): string {
  return keepPhrasesTogether(block.text, 'ar')
}

// Browser storage is a convenience here: a private window or blocked site data
// just means the draft is not restored.
function readDraft(): string {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? ''
  } catch {
    return ''
  }
}

function writeDraft(text: string) {
  try {
    localStorage.setItem(DRAFT_KEY, text)
  } catch {}
}

function SlideFrame({ children, counter }: { children: React.ReactNode; counter: string }) {
  return (
    <>
      <div className={styles.rule} />
      <div className={styles.body}>{children}</div>
      <div className={styles.footer}>
        <span className={styles.wordmark}>the long thought</span>
        <span className={styles.counter}>{counter}</span>
      </div>
    </>
  )
}

// Fonts load lazily, so measuring before they arrive would size the text in
// the fallback face. Loads every face a slide uses, then resolves.
async function loadSlideFonts(slide: HTMLElement) {
  const serif = getComputedStyle(slide).fontFamily
  const wordmark = getComputedStyle(slide.querySelector(`.${styles.wordmark}`) ?? slide).fontFamily
  await Promise.all([
    document.fonts.load(`400 60px ${serif}`, 'ابت'),
    document.fonts.load(`600 60px ${serif}`, 'ابت'),
    document.fonts.load(`400 34px ${wordmark}`, 'the long thought'),
  ])
  await document.fonts.ready
}

// Builds the "does it fit" check against a hidden copy of a real slide, so the
// packing sees exactly the type, measure and wrapping the export will have.
function createFits(measureSlide: HTMLElement) {
  const body = measureSlide.querySelector<HTMLElement>(`.${styles.body}`)!
  const content = body.firstElementChild as HTMLElement
  const bodyStyle = getComputedStyle(body)
  const available =
    body.clientHeight - parseFloat(bodyStyle.paddingTop) - parseFloat(bodyStyle.paddingBottom)

  return (blocks: Block[]) => {
    content.replaceChildren(
      ...blocks.map((block) => {
        const el = document.createElement(blockTag(block))
        el.className = blockClass(block)
        el.textContent = display(block)
        return el
      })
    )
    return content.offsetHeight <= available
  }
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

export function PostImageTool() {
  // The tool renders only in the browser (see ClientOnlyTool), so the draft
  // can be read straight into the initial state.
  const [text, setText] = useState(() => withKeptPhrases(readDraft()))
  const [filePrefix, setFilePrefix] = useState('post')
  const [slides, setSlides] = useState<Slide[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toolRef = useRef<HTMLElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  const tokens = useMemo(() => parsePost(text), [text])

  useEffect(() => {
    let cancelled = false
    // Waits for typing to pause; every slide is re-measured.
    const timer = setTimeout(async () => {
      writeDraft(text)
      const measureSlide = measureRef.current
      if (!measureSlide) return
      await loadSlideFonts(measureSlide)
      if (cancelled) return
      setSlides(splitAtBreaks(tokens, createFits(measureSlide)))
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [text, tokens])

  const total = slides.length
  const counterFor = (index: number) =>
    `${arabicDigits.format(index + 1)} / ${arabicDigits.format(total)}`

  const fileName = (index: number) =>
    `${filePrefix.trim() || 'post'}-${String(index + 1).padStart(2, '0')}.png`

  async function exportSlides(indexes: number[]) {
    const nodes = indexes.map((index) => slideRefs.current[index])
    const tool = toolRef.current
    if (!tool || nodes.some((node) => !node)) return
    setBusy(true)
    setError(null)
    try {
      for (const [i, node] of nodes.entries()) {
        const dataUrl = await renderSlidePng(node!, tool, SLIDE_WIDTH, SLIDE_HEIGHT)
        downloadDataUrl(dataUrl, fileName(indexes[i]))
      }
    } catch (err) {
      setError(`書き出しに失敗しました：${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  const overflowCount = slides.filter((slide) => slide.overflows).length

  // Replaces the author's "---" lines with a proposed split, which they then
  // move by hand. Headings and the title are kept; only the breaks change.
  async function proposeBreaks() {
    const measureSlide = measureRef.current
    if (!measureSlide) return
    await loadSlideFonts(measureSlide)
    const withoutBreaks = tokens.filter((token) => token.kind !== 'break')
    setText(withKeptPhrases(slidesToText(packSlides(withoutBreaks, createFits(measureSlide)))))
  }

  return (
    <main ref={toolRef} className={styles.tool} dir="ltr" lang="ja">
      <section className={styles.panel}>
        <h1 className={styles.panelTitle}>Instagram 投稿画像</h1>
        <p className={styles.hint}>
          1行＝1段落。「# 」はタイトル、「## 」は小見出し。画像は「---」の位置でだけ切り替わります。
          まず「自動で区切る」で区切りを入れて、あとは「---」の行を好きな位置に動かしてください。
          .mdx をそのまま貼っても読めます。
        </p>

        <label className={`${styles.field} ${styles.editorField}`}>
          <span>本文（アラビア語）</span>
          <div className={styles.editorScroll}>
            <textarea
              className={styles.textarea}
              dir="rtl"
              lang="ar"
              value={text}
              onChange={(event) => {
                const { selectionStart, selectionEnd } = event.target
                setText(withKeptPhrases(event.target.value))
                // A controlled value that differs from what was typed puts the
                // caret at the end; put it back where the author was typing.
                requestAnimationFrame(() =>
                  event.target.setSelectionRange(selectionStart, selectionEnd)
                )
              }}
              placeholder="# بداية جديدة، بالكتابة"
            />
          </div>
        </label>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonQuiet}`}
            disabled={busy || tokens.length === 0}
            onClick={proposeBreaks}
          >
            自動で区切る
          </button>
          <span className={styles.status}>今ある「---」は置き換わります</span>
        </div>

        <label className={styles.field}>
          <span>ファイル名</span>
          <input
            className={styles.input}
            style={{ fontFamily: 'var(--font-ui)', fontSize: 14 }}
            value={filePrefix}
            onChange={(event) => setFilePrefix(event.target.value)}
          />
        </label>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.button}
            disabled={busy || total === 0}
            onClick={() => exportSlides(Array.from({ length: total }, (_, i) => i))}
          >
            {busy ? '書き出し中…' : `全部書き出す（${total}枚）`}
          </button>
          <span className={styles.status}>1080×1350 PNG</span>
        </div>
        {total > MAX_SLIDES_PER_POST && (
          <p className={styles.error}>
            Instagram の1投稿は{MAX_SLIDES_PER_POST}枚までです。「---」の位置で2投稿に分けてください。
          </p>
        )}
        {overflowCount > 0 && (
          <p className={styles.error}>
            {overflowCount}枚で文字がはみ出しています（赤枠）。その画像の「---」を前に動かしてください。
          </p>
        )}
        {error && <p className={styles.error}>{error}</p>}
      </section>

      <section className={styles.grid} aria-label="プレビュー">
        {total === 0 && <p className={styles.empty}>本文を貼るとここにプレビューが出ます。</p>}

        {slides.map((slide, index) => (
          <div key={index} className={styles.previewItem}>
            <div
              className={`${styles.previewFrame} ${slide.overflows ? styles.previewFrameOverflow : ''}`}
            >
              <div className={styles.previewScale}>
                <div
                  ref={(node) => {
                    slideRefs.current[index] = node
                  }}
                  className={styles.slide}
                  dir="rtl"
                  lang="ar"
                >
                  <SlideFrame counter={counterFor(index)}>
                    <div>
                      {slide.blocks.map((block, i) => {
                        const Tag = blockTag(block)
                        return (
                          <Tag key={i} className={blockClass(block)}>
                            {display(block)}
                          </Tag>
                        )
                      })}
                    </div>
                  </SlideFrame>
                </div>
              </div>
            </div>
            <div className={styles.previewMeta}>
              {slide.overflows ? (
                <span className={styles.overflowNote}>はみ出しています</span>
              ) : (
                <span className={styles.status}>{fileName(index)}</span>
              )}
              <button
                type="button"
                className={`${styles.button} ${styles.buttonQuiet}`}
                disabled={busy}
                onClick={() => exportSlides([index])}
              >
                この1枚
              </button>
            </div>
          </div>
        ))}

      </section>

      {/* Hidden slide the packing measures against. */}
      <div className={styles.measure} aria-hidden="true">
        <div ref={measureRef} className={styles.slide} dir="rtl" lang="ar">
          <SlideFrame counter="١ / ١">
            <div />
          </SlideFrame>
        </div>
      </div>
    </main>
  )
}
