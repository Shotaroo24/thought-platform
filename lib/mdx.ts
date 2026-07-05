import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export type Lang = 'ar' | 'en'

export type Frontmatter = {
  title: string
  date: string
  slug: string
  description: string
  pinned?: boolean
  ogImage?: string
}

function contentDir(lang: Lang): string {
  return path.join(process.cwd(), 'content', lang)
}

export function getMdxSlugs(lang: Lang): string[] {
  const dir = contentDir(lang)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''))
}

export function getMdxBySlug(lang: Lang, slug: string): { frontmatter: Frontmatter; content: string } {
  const filePath = path.join(contentDir(lang), `${slug}.mdx`)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  // Cast is safe here: all .mdx files under content/ are authored in this repo,
  // not user-submitted, so frontmatter shape is guaranteed by convention.
  return {
    frontmatter: data as Frontmatter,
    content,
  }
}

function getAllMdxSorted(lang: Lang): { frontmatter: Frontmatter; content: string }[] {
  return getMdxSlugs(lang)
    .map((slug) => getMdxBySlug(lang, slug))
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
