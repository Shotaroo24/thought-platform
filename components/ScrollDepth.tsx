'use client'

import { useEffect, useRef } from 'react'
import { sendGAEvent } from '@next/third-parties/google'

type Props = {
  slug: string
  lang: string
}

const THRESHOLDS = [25, 50, 75, 100]

export function ScrollDepth({ slug, lang }: Props) {
  const fired = useRef<Set<number>>(new Set())

  useEffect(() => {
    fired.current.clear()

    function onScroll() {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return

      const percent = Math.round((scrollTop / docHeight) * 100)

      for (const threshold of THRESHOLDS) {
        if (percent >= threshold && !fired.current.has(threshold)) {
          fired.current.add(threshold)
          sendGAEvent('event', 'scroll_depth', {
            percent: threshold,
            slug,
            lang,
          })
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    // 初期チェック（ページが短い場合100%が即発火）
    onScroll()

    return () => window.removeEventListener('scroll', onScroll)
  }, [slug, lang])

  return null
}
