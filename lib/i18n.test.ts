import { test } from 'node:test'
import assert from 'node:assert/strict'
import { negotiateLang } from './i18n.ts'

test('Arabic browsers get Arabic, including regional variants', () => {
  assert.equal(negotiateLang('ar'), 'ar')
  assert.equal(negotiateLang('ar-SA,ar;q=0.9'), 'ar')
  assert.equal(negotiateLang('AR-sa'), 'ar')
})

test('English browsers get English, including regional variants', () => {
  assert.equal(negotiateLang('en-US,en;q=0.9'), 'en')
  assert.equal(negotiateLang('en-GB'), 'en')
})

test('the higher q-value wins when both languages are listed', () => {
  assert.equal(negotiateLang('en-US,en;q=0.9,ar;q=0.8'), 'en')
  assert.equal(negotiateLang('ar;q=0.9,en;q=0.5'), 'ar')
  assert.equal(negotiateLang('en;q=0.4,ar;q=0.6'), 'ar')
})

test('on equal q-values the language listed first wins', () => {
  assert.equal(negotiateLang('ar,en'), 'ar')
  assert.equal(negotiateLang('en,ar'), 'en')
})

test('a supported language further down the list is still used', () => {
  assert.equal(negotiateLang('ja-JP,ja;q=0.9,ar;q=0.5'), 'ar')
  assert.equal(negotiateLang('fr-FR,fr;q=0.9,en;q=0.3'), 'en')
})

test('browsers preferring neither language fall back to English', () => {
  assert.equal(negotiateLang('ja-JP,ja;q=0.9'), 'en')
  assert.equal(negotiateLang('*'), 'en')
})

test('a missing or empty header falls back to English', () => {
  assert.equal(negotiateLang(null), 'en')
  assert.equal(negotiateLang(''), 'en')
})

test('q=0 and malformed q-values are not treated as a preference', () => {
  assert.equal(negotiateLang('ar;q=0,ja'), 'en')
  assert.equal(negotiateLang('ar;q=abc,en;q=0.1'), 'en')
})
