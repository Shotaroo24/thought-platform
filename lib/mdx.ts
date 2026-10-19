import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import type { Lang } from '@/lib/i18n'

export { LANGS, DEFAULT_LANG, isLang } from '@/lib/i18n'
export type { Lang } from '@/lib/i18n'

export type Frontmatter = {
  title: string
  date: string
  slug: string
  description: string
  pinned?: boolean
  ogImage?: string
}

// A slug becomes part of a filesystem path, so only the shape our own content
// uses is accepted: lowercase kebab-case. This rejects `..`, path separators,
// absolute paths and NUL bytes before any fs call.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isSafeSlug(value: string): boolean {
  return SLUG_PATTERN.test(value)
}

function contentDir(lang: Lang): string {
  return path.join(process.cwd(), 'content', lang)
}

// Second line of defence behind isSafeSlug: whatever path.join produced must
// still sit directly inside content/<lang>.
function resolveMdxPath(lang: Lang, slug: string): string | null {
  if (!isSafeSlug(slug)) return null
  const dir = contentDir(lang)
  const filePath = path.join(dir, `${slug}.mdx`)
  if (path.dirname(filePath) !== dir) return null
  return filePath
}

export function getMdxSlugs(lang: Lang): string[] {
  const dir = contentDir(lang)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''))
    .filter(isSafeSlug)
}

const FRONTMATTER_PATTERN = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/

// Frontmatter is parsed with js-yaml's JSON schema: no YAML type coercion, so
// `date: 2026-07-05` stays a string and no custom tags are resolved.
function parseFrontmatter(raw: string): { data: unknown; content: string } {
  const match = raw.match(FRONTMATTER_PATTERN)
  if (!match) return { data: {}, content: raw }
  const data = yaml.load(match[1], { schema: yaml.JSON_SCHEMA, json: true })
  return { data: data ?? {}, content: raw.slice(match[0].length) }
}

function requireString(
  data: Record<string, unknown>,
  key: keyof Frontmatter,
  source: string
): string {
  const value = data[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${source}: frontmatter "${key}" must be a non-empty string`)
  }
  return value
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// MDX files are authored in this repo, but validating here turns a typo into a
// build-time error with a precise message instead of an "Invalid Date" or an
// empty card shipped to production.
function validateFrontmatter(data: unknown, lang: Lang, slug: string): Frontmatter {
  const source = `content/${lang}/${slug}.mdx`
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`${source}: frontmatter block is missing or not a mapping`)
  }
  const record = data as Record<string, unknown>

  const date = requireString(record, 'date', source)
  if (!DATE_PATTERN.test(date) || Number.isNaN(new Date(date).getTime())) {
    throw new Error(`${source}: frontmatter "date" must be a valid YYYY-MM-DD date`)
  }

  const declaredSlug = requireString(record, 'slug', source)
  if (declaredSlug !== slug) {
    throw new Error(
      `${source}: frontmatter "slug" is "${declaredSlug}" but the file is "${slug}.mdx"`
    )
  }

  const { pinned, ogImage } = record
  if (pinned !== undefined && typeof pinned !== 'boolean') {
    throw new Error(`${source}: frontmatter "pinned" must be a boolean`)
  }
  // Site-relative only: frontmatter must not be able to point OG/Twitter
  // metadata at a third-party host.
  if (ogImage !== undefined && (typeof ogImage !== 'string' || !/^\/[^/\\]/.test(ogImage))) {
    throw new Error(
      `${source}: frontmatter "ogImage" must be a site-relative path like "/og/foo.png"`
    )
  }

  return {
    title: requireString(record, 'title', source),
    date,
    slug: declaredSlug,
    description: requireString(record, 'description', source),
    ...(pinned === undefined ? {} : { pinned }),
    ...(ogImage === undefined ? {} : { ogImage: ogImage as string }),
  }
}

export type Article = { frontmatter: Frontmatter; content: string }

// Returns null for an unknown or unsafe slug so callers can answer 404 instead
// of surfacing a filesystem error.
export function getMdxBySlug(lang: Lang, slug: string): Article | null {
  const filePath = resolveMdxPath(lang, slug)
  if (!filePath || !fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = parseFrontmatter(raw)
  return {
    frontmatter: validateFrontmatter(data, lang, slug),
    content,
  }
}

function getAllMdxSorted(lang: Lang): Article[] {
  return getMdxSlugs(lang)
    .map((slug) => getMdxBySlug(lang, slug))
    .filter((article): article is Article => article !== null)
    .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime())
}

export function getAllMdxFrontmatter(lang: Lang): Frontmatter[] {
  return getAllMdxSorted(lang).map((a) => a.frontmatter)
}

// Strips the leading markdown/JSX markup a card preview shouldn't show
// (headings, blockquote markers, links, emphasis, inline tags like <br />).
function stripMdxInline(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, '')
    .replace(/^>\s?/, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__|\*|_|`)/g, '')
}

// Takes the article's opening paragraph (skipping headings) as the homepage
// card preview, in place of a hand-written summary. Truncates at a word
// boundary so longer articles don't cut off mid-word.
export function getArticleExcerpt(content: string, maxLength = 180): string {
  const paragraph = content
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .find((block) => block.length > 0 && !block.startsWith('#'))
  if (!paragraph) return ''

  const text = paragraph
    .split(/\r?\n/)
    .map(stripMdxInline)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= maxLength) return text

  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd()}…`
}

export type ArticleListItem = Frontmatter & { excerpt: string }

export function getAllArticlesWithExcerpt(lang: Lang): ArticleListItem[] {
  return getAllMdxSorted(lang).map(({ frontmatter, content }) => ({
    ...frontmatter,
    excerpt: getArticleExcerpt(content),
  }))
}

// Arabic numerals are forced via the -u-nu-arab extension rather than relying on the
// bare "ar" locale, whose digit rendering depends on the runtime's ICU data.
// timeZone is pinned to UTC so the displayed day/month never drifts with the server's locale.
function dateLocale(lang: Lang): string {
  return lang === 'ar' ? 'ar-u-nu-arab' : 'en'
}

export function formatArticleDate(date: string, lang: Lang): string {
  return new Intl.DateTimeFormat(dateLocale(lang), {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date))
}

// 日付昇順で「次の記事」（現在より古いもの）を返す。なければ null
// ピン留め記事（イントロ）は次の記事の連鎖から除外する
export function getNextArticle(lang: Lang, currentSlug: string): Frontmatter | null {
  const articles = getAllMdxFrontmatter(lang).filter((a) => !a.pinned) // newest-first
  const idx = articles.findIndex((a) => a.slug === currentSlug)
  if (idx === -1 || idx === articles.length - 1) return null
  return articles[idx + 1]
}
