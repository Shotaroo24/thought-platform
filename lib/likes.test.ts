import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLikeStore, type LikeStorage } from './likes.ts'

function memoryStorage(): LikeStorage {
  const items = new Map<string, string>()
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  }
}

function brokenStorage(): LikeStorage {
  const fail = () => {
    throw new DOMException('denied', 'SecurityError')
  }
  return { getItem: fail, setItem: fail, removeItem: fail }
}

test('an article starts unliked', () => {
  const store = createLikeStore(memoryStorage)
  assert.equal(store.isLiked('starting-again'), false)
})

test('tapping the heart likes, tapping again takes it back', () => {
  const store = createLikeStore(memoryStorage)
  assert.equal(store.toggle('starting-again'), true)
  assert.equal(store.isLiked('starting-again'), true)
  assert.equal(store.toggle('starting-again'), false)
  assert.equal(store.isLiked('starting-again'), false)
})

test('a like survives a reload in the same browser', () => {
  const storage = memoryStorage()
  createLikeStore(() => storage).toggle('starting-again')
  const afterReload = createLikeStore(() => storage)
  assert.equal(afterReload.isLiked('starting-again'), true)
})

test('likes are tracked per article', () => {
  const store = createLikeStore(memoryStorage)
  store.toggle('starting-again')
  assert.equal(store.isLiked('another-article'), false)
})

test('the heart still works for the visit when storage is unavailable', () => {
  const store = createLikeStore(brokenStorage)
  assert.equal(store.isLiked('starting-again'), false)
  assert.equal(store.toggle('starting-again'), true)
  assert.equal(store.isLiked('starting-again'), true)
  assert.equal(store.toggle('starting-again'), false)
})

test('subscribers hear about every toggle until they unsubscribe', () => {
  const store = createLikeStore(memoryStorage)
  let calls = 0
  const unsubscribe = store.subscribe(() => calls++)
  store.toggle('starting-again')
  store.toggle('starting-again')
  unsubscribe()
  store.toggle('starting-again')
  assert.equal(calls, 2)
})
