import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chooseLang, negotiateLang } from './i18n.ts'

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

test('a missing or empty header falls back to Arabic', () => {
  assert.equal(negotiateLang(null), 'ar')
  assert.equal(negotiateLang(''), 'ar')
})

test('q=0 and malformed q-values are not treated as a preference', () => {
  assert.equal(negotiateLang('ar;q=0,ja'), 'en')
  assert.equal(negotiateLang('ar;q=abc,en;q=0.1'), 'en')
})

test('visitors in Arab countries get Arabic even with an English browser', () => {
  assert.equal(chooseLang('en-US,en;q=0.9', 'SA'), 'ar')
  assert.equal(chooseLang('en-GB', 'EG'), 'ar')
  assert.equal(chooseLang(null, 'AE'), 'ar')
  assert.equal(chooseLang('en', 'iq'), 'ar')
})

test('outside Arab countries the browser language decides', () => {
  assert.equal(chooseLang('en-US,en;q=0.9', 'US'), 'en')
  assert.equal(chooseLang('ar-SA', 'US'), 'ar')
  assert.equal(chooseLang('ja-JP,ja;q=0.9', 'JP'), 'en')
  assert.equal(chooseLang(null, 'JP'), 'ar')
})

test('an unknown country leaves the decision to the browser', () => {
  assert.equal(chooseLang('en-US', null), 'en')
  assert.equal(chooseLang('ar', ''), 'ar')
  assert.equal(chooseLang(null, null), 'ar')
})
