'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import type { Lang } from '@/lib/i18n'

type Props = {
  title: string
  url: string
  lang: Lang
}

type CopyStatus = 'idle' | 'copied' | 'failed'

const LABEL = {
  share:  { ar: 'شارك', en: 'Share' },
  copied: { ar: 'اننسخ الرابط', en: 'Copied' },
  failed: { ar: 'ما ضبط النسخ', en: 'Copy failed' },
} satisfies Record<string, Record<Lang, string>>

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.732-8.83L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="M7 8l5-5 5 5" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  )
}

// Readers arrive mostly on phones from Instagram/TikTok, where the OS share
// sheet already lists every app they use. Desktop browsers either lack
// navigator.share or show a sheet without those apps, so they get explicit buttons.
function prefersNativeShare(): boolean {
  return (
    typeof navigator.share === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  )
}

// The device's share capability doesn't change during a visit.
function subscribeNever(): () => void {
  return () => {}
}

export function ShareBar({ title, url, lang }: Props) {
  // false during SSR and hydration, then the real capability on the client.
  const nativeShare = useSyncExternalStore(subscribeNever, prefersNativeShare, () => false)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')

  useEffect(() => {
    if (copyStatus === 'idle') return
    const timer = setTimeout(() => setCopyStatus('idle'), 2000)
    return () => clearTimeout(timer)
  }, [copyStatus])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopyStatus('copied')
    } catch {
      // Clipboard access can be denied (permissions, insecure context, some
      // in-app browsers); say so instead of leaving the click silent.
      setCopyStatus('failed')
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title, url })
    } catch (error) {
      // Closing the sheet rejects with AbortError, which is not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return
      await handleCopy()
    }
  }

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`

  return (
    <div className="share-bar">
      <span className="share-label">{LABEL.share[lang]}</span>
      <div className="share-icons">
        {nativeShare ? (
          <button
            type="button"
            className="share-icon-btn"
            onClick={handleNativeShare}
            aria-label="Share this article"
          >
            <ShareIcon />
          </button>
        ) : (
          <>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="share-icon-btn"
              aria-label="Share on WhatsApp"
            >
              <WhatsAppIcon />
            </a>
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="share-icon-btn"
              aria-label="Share on X"
            >
              <XIcon />
            </a>
          </>
        )}
        <button
          type="button"
          className="share-icon-btn"
          onClick={handleCopy}
          aria-label="Copy link"
          data-status={copyStatus}
        >
          {copyStatus === 'idle' ? <LinkIcon /> : LABEL[copyStatus][lang]}
        </button>
      </div>
      <span className="sr-only" role="status">
        {copyStatus === 'idle' ? '' : LABEL[copyStatus][lang]}
      </span>
    </div>
  )
}
