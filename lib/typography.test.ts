import { test } from 'node:test'
import assert from 'node:assert/strict'
import { keepPhrasesTogether } from './typography.ts'

const NBSP = ' '

test('Arabic fixed terms are joined with no-break spaces', () => {
  assert.equal(
    keepPhrasesTogether('وبرجع للسوشيال ميديا شوي', 'ar'),
    `وبرجع للسوشيال${NBSP}ميديا شوي`
  )
  assert.equal(keepPhrasesTogether('سواء عن طريق السوشيال', 'ar'), `سواء عن${NBSP}طريق السوشيال`)
})

test('Latin terms inside Arabic text stay together', () => {
  assert.equal(
    keepPhrasesTogether('عن طريق vibe coding مع Claude Code.', 'ar'),
    `عن${NBSP}طريق vibe${NBSP}coding مع Claude${NBSP}Code.`
  )
})

test('the site name stays on one line', () => {
  assert.equal(
    keepPhrasesTogether('تحت اسم the long thought.', 'ar'),
    `تحت اسم the${NBSP}long${NBSP}thought.`
  )
})

test('a tatweel prefix sticks to the word after it', () => {
  assert.equal(keepPhrasesTogether('من الـ input، بديت', 'ar'), `من الـ${NBSP}input، بديت`)
  assert.equal(keepPhrasesTogether('سويته بـ vibe', 'ar'), `سويته بـ${NBSP}vibe`)
})

test('English only joins its own list', () => {
  assert.equal(
    keepPhrasesTogether('using Claude Code to build social media', 'en'),
    `using Claude${NBSP}Code to build social media`
  )
})

test('text without listed terms is returned unchanged', () => {
  const text = '## heading\n\nA paragraph with [a link](https://example.com/a b).\n'
  assert.equal(keepPhrasesTogether(text, 'en'), text)
  assert.equal(keepPhrasesTogether('مرحبا فيكم جميعاً', 'ar'), 'مرحبا فيكم جميعاً')
})

test('newlines are never turned into no-break spaces', () => {
  assert.equal(keepPhrasesTogether('الـ\ninput', 'ar'), 'الـ\ninput')
})
