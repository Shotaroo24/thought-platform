'use client'

import { useSyncExternalStore } from 'react'
import { sendGAEvent } from '@next/third-parties/google'
import { createLikeStore } from '@/lib/likes'
import type { Lang } from '@/lib/i18n'

type Props = {
  slug: string
  lang: Lang
}

const likeStore = createLikeStore(() => window.localStorage)

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export function LikeButton({ slug, lang }: Props) {
  // Unliked during SSR and hydration, then this browser's remembered choice.
  const liked = useSyncExternalStore(likeStore.subscribe, () => likeStore.isLiked(slug), () => false)

  function handleClick() {
    const nowLiked = likeStore.toggle(slug)
    // GA4 can't retract an event, so taking a like back is its own event:
    // the net count per article is `like` minus `unlike`.
    sendGAEvent('event', nowLiked ? 'like' : 'unlike', { slug, lang })
  }

  return (
    <button
      type="button"
      className="share-icon-btn like-btn"
      onClick={handleClick}
      aria-label="Like this article"
      aria-pressed={liked}
      data-liked={liked}
    >
      <HeartIcon filled={liked} />
    </button>
  )
}
