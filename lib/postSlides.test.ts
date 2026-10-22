import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  packSlides,
  parsePost,
  slidesToText,
  splitAtBreaks,
  splitSentences,
  type Block,
} from './postSlides.ts'

// Stand-in for DOM measurement: a slide holds up to `limit` characters.
const fitsWithin = (limit: number) => (blocks: Block[]) =>
  blocks.reduce((sum, block) => sum + block.text.length, 0) <= limit

const texts = (slides: ReturnType<typeof packSlides>) =>
  slides.map((slide) => slide.blocks.map((block) => block.text))

test('a blank line ends a paragraph, a plain line break stays inside it', () => {
  assert.deepEqual(parsePost('# عنوان\n\nسطر أول\n  سطر ثاني\n\nفقرة\n## قسم\n---\nآخر'), [
    { kind: 'title', text: 'عنوان' },
    { kind: 'paragraph', text: 'سطر أول\nسطر ثاني' },
    { kind: 'paragraph', text: 'فقرة' },
    { kind: 'heading', text: 'قسم' },
    { kind: 'break' },
    { kind: 'paragraph', text: 'آخر' },
  ])
})

test('text without blank lines (a Google Docs paste) has one paragraph per line', () => {
  assert.deepEqual(parsePost('# عنوان\nسطر أول\nسطر ثاني'), [
    { kind: 'title', text: 'عنوان' },
    { kind: 'paragraph', text: 'سطر أول' },
    { kind: 'paragraph', text: 'سطر ثاني' },
  ])
})

test('a paragraph with a line break round-trips through the text', () => {
  const text = 'aa\nbb\n\ncc\n'
  assert.equal(slidesToText(splitAtBreaks(parsePost(text), () => true)), text)
})

test('an .mdx frontmatter becomes the title and is not read as a break', () => {
  const mdx = '---\ntitle: "بداية جديدة، بالكتابة"\nslug: "starting-again"\n---\n\nمرحبا'
  assert.deepEqual(parsePost(mdx), [
    { kind: 'title', text: 'بداية جديدة، بالكتابة' },
    { kind: 'paragraph', text: 'مرحبا' },
  ])
})

test('sentences split after . ! ? and the Arabic question mark, not the Arabic comma', () => {
  assert.deepEqual(splitSentences('وش كنت أسوي؟ باختصار، input. خلاص!'), [
    'وش كنت أسوي؟',
    'باختصار، input.',
    'خلاص!',
  ])
})

test('paragraphs fill a slide until the next one does not fit', () => {
  const slides = packSlides(parsePost('aaaa\nbbbb\ncccc'), fitsWithin(8))
  assert.deepEqual(texts(slides), [['aaaa', 'bbbb'], ['cccc']])
})

test('the lead joins the title on the cover', () => {
  const slides = packSlides(parsePost('# T\naa\nbb\n## h\ncc'), fitsWithin(100))
  assert.deepEqual(texts(slides), [['T', 'aa', 'bb'], ['h', 'cc']])
})

test('a lead too long for the cover moves to the next slide', () => {
  const slides = packSlides(parsePost('# T\naaaaaaaa'), fitsWithin(8))
  assert.deepEqual(texts(slides), [['T'], ['aaaaaaaa']])
})

test('--- forces a new slide', () => {
  const slides = packSlides(parsePost('aa\n---\nbb'), fitsWithin(100))
  assert.deepEqual(texts(slides), [['aa'], ['bb']])
})

test('a heading always opens a new slide, even with room left', () => {
  const slides = packSlides(parsePost('aa\n## hh\npp'), fitsWithin(100))
  assert.deepEqual(texts(slides), [['aa'], ['hh', 'pp']])
})

test('a paragraph too long for one slide is split into sentences', () => {
  const slides = packSlides(parsePost('one. two. three.'), fitsWithin(10))
  assert.deepEqual(texts(slides), [['one.', 'two.'], ['three.']])
  assert.ok(slides.every((slide) => !slide.overflows))
})

test('a sentence too long for an empty slide is kept and flagged', () => {
  const slides = packSlides(parsePost('short\nwaytoolongsentence'), fitsWithin(8))
  assert.deepEqual(texts(slides), [['short'], ['waytoolongsentence']])
  assert.deepEqual(
    slides.map((slide) => slide.overflows),
    [false, true]
  )
})

test("the author's split: a new slide at every --- and nowhere else", () => {
  const slides = splitAtBreaks(parsePost('# T\naa\n## h\nbb\n---\ncc'), fitsWithin(100))
  assert.deepEqual(texts(slides), [['T', 'aa', 'h', 'bb'], ['cc']])
  assert.ok(slides.every((slide) => !slide.overflows))
})

test('a slide taller than the image is flagged, not cut', () => {
  const slides = splitAtBreaks(parsePost('aaaa\nbbbb\n---\ncc'), fitsWithin(6))
  assert.deepEqual(texts(slides), [['aaaa', 'bbbb'], ['cc']])
  assert.deepEqual(
    slides.map((slide) => slide.overflows),
    [true, false]
  )
})

test('a proposed split round-trips through the text', () => {
  const tokens = parsePost('# T\naa\n## h\nbbbb\ncccc')
  const proposed = packSlides(tokens, fitsWithin(8))
  const text = slidesToText(proposed)
  assert.equal(text, '# T\n\naa\n\n---\n\n## h\n\nbbbb\n\n---\n\ncccc\n')
  assert.deepEqual(texts(splitAtBreaks(parsePost(text), fitsWithin(8))), texts(proposed))
})
