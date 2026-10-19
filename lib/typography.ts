import type { Lang } from './i18n.ts'

const NBSP = ' '

// Multi-word terms that read as one unit. A line break inside them strands
// half a term at the end of a line ("للسوشيال" / "ميديا"), so their inner
// spaces become no-break spaces before rendering. Add a term here when a
// break inside it looks wrong on a phone. Matching is by substring, so list
// Arabic terms without their attached prefixes: "سوشيال ميديا" also covers
// "السوشيال ميديا" and "للسوشيال ميديا".
const KEEP_TOGETHER: Record<Lang, readonly string[]> = {
  ar: ['سوشيال ميديا', 'عن طريق', 'vibe coding', 'Claude Code'],
  en: ['Claude Code'],
}

// Arabic prefixes written with a tatweel and a space before a Latin word
// ("الـ input", "بـ vibe") belong to the word that follows them.
const ARABIC_PREFIX_SPACE = /(\S*ـ) (?=\S)/g

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const PHRASE_PATTERNS: Record<Lang, RegExp[]> = {
  ar: KEEP_TOGETHER.ar.map((phrase) => new RegExp(escapeRegExp(phrase), 'g')),
  en: KEEP_TOGETHER.en.map((phrase) => new RegExp(escapeRegExp(phrase), 'g')),
}

// Applied to article bodies and card excerpts. Only spaces inside the listed
// terms change, so MDX syntax and line structure are left intact.
export function keepPhrasesTogether(text: string, lang: Lang): string {
  let result = text
  for (const pattern of PHRASE_PATTERNS[lang]) {
    result = result.replace(pattern, (match) => match.replaceAll(' ', NBSP))
  }
  if (lang === 'ar') result = result.replace(ARABIC_PREFIX_SPACE, `$1${NBSP}`)
  return result
}
