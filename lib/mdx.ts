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
  return {
    frontmatter: data as Frontmatter,
    content,
  }
}

export function getAllMdxFrontmatter(lang: Lang): Frontmatter[] {
  return getMdxSlugs(lang)
    .map((slug) => getMdxBySlug(lang, slug).frontmatter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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

export function formatArticleDateLong(date: string, lang: Lang): string {
  return new Intl.DateTimeFormat(dateLocale(lang), {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
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
