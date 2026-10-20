// Likes are for the author only: the heart reports like/unlike to GA4 and
// never shows a count, so there is no backend to store or tally them. The
// browser remembers its own choice so the heart stays filled on later visits
// and the reader can take it back.

export type LikeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const KEY_PREFIX = 'liked:'

// Keyed by slug alone, so liking the Arabic version also fills the heart on the
// English one: it is the same article.
export function createLikeStore(getStorage: () => LikeStorage) {
  // localStorage throws in some private modes and in-app browsers. Remembering
  // the choice here keeps the heart responsive for the rest of the visit even
  // when it can't be persisted.
  const memory = new Map<string, boolean>()
  const listeners = new Set<() => void>()

  function isLiked(slug: string): boolean {
    const remembered = memory.get(slug)
    if (remembered !== undefined) return remembered
    try {
      return getStorage().getItem(KEY_PREFIX + slug) === '1'
    } catch {
      return false
    }
  }

  // Returns the new state so the caller can report which way it flipped.
  function toggle(slug: string): boolean {
    const liked = !isLiked(slug)
    memory.set(slug, liked)
    try {
      const storage = getStorage()
      if (liked) storage.setItem(KEY_PREFIX + slug, '1')
      else storage.removeItem(KEY_PREFIX + slug)
    } catch {
      // Not persisted across visits; the in-memory value still applies.
    }
    listeners.forEach((listener) => listener())
    return liked
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  return { isLiked, toggle, subscribe }
}
