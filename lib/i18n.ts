// Single source of truth for the supported locales. Kept free of Node-only
// imports so the proxy (edge runtime) can share it with the server components.
export const LANGS = ['ar', 'en'] as const

export type Lang = (typeof LANGS)[number]

export const DEFAULT_LANG: Lang = 'ar'

// Route params arrive as plain strings, so every entry point narrows them here
// instead of casting. An unknown locale must 404, never reach the filesystem.
export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value)
}
