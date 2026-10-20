// Single source of truth for the supported locales. Kept free of Node-only
// imports so the proxy (edge runtime) can share it with the server components.
export const LANGS = ['ar', 'en'] as const

export type Lang = (typeof LANGS)[number]

// Used when the visitor's browser prefers neither Arabic nor English, and when
// there is no preference at all (crawlers, privacy browsers).
export const FALLBACK_LANG: Lang = 'en'

// Open Graph wants a territory as well as a language.
export const OG_LOCALE: Record<Lang, string> = {
  ar: 'ar_SA',
  en: 'en_US',
}

// Route params arrive as plain strings, so every entry point narrows them here
// instead of casting. An unknown locale must 404, never reach the filesystem.
export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value)
}

// Picks the site language from an Accept-Language header such as
// "ja-JP,ja;q=0.9,en-US;q=0.8,ar;q=0.7": the supported language with the
// highest q wins (ties go to the one listed first), and region subtags are
// ignored so "ar-SA" and "en-GB" match. With two locales a tiny parser is
// enough; a negotiation library would add dependencies for no gain.
export function negotiateLang(acceptLanguage: string | null): Lang {
  if (!acceptLanguage) return FALLBACK_LANG

  let best: { lang: Lang; q: number } | null = null
  for (const entry of acceptLanguage.split(',')) {
    const [tag, ...params] = entry.split(';')
    const primary = tag.trim().toLowerCase().split('-')[0]
    if (!isLang(primary)) continue

    const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
    const q = qParam === undefined ? 1 : Number(qParam.slice(2))
    // q=0 means "not acceptable"; a malformed q is ignored rather than trusted.
    if (!Number.isFinite(q) || q <= 0) continue

    if (best === null || q > best.q) best = { lang: primary, q }
  }
  return best?.lang ?? FALLBACK_LANG
}
