import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { formatArticleDate, getMdxBySlug, getMdxSlugs, getNextArticle, isLang } from '@/lib/mdx'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ScrollDepth } from '@/components/ScrollDepth'
import { ShareBar } from '@/components/ShareBar'
import { NextArticleCTA } from '@/components/NextArticleCTA'
import { InstagramDmCTA } from '@/components/InstagramDmCTA'
import { SITE_URL } from '@/lib/site'
import type { Lang } from '@/lib/i18n'

type Params = { lang: string; slug: string }

// Only the (lang, slug) pairs from generateStaticParams are served. Without
// this, an unknown slug would be rendered on demand and reach the filesystem.
export const dynamicParams = false

function readingTimeMin(text: string, lang: Lang): number {
  const wpm = lang === 'ar' ? 180 : 238
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / wpm))
}

const arabicDigits = new Intl.NumberFormat('ar-u-nu-arab')

// Arabic counts change the noun's form: 1 and 2 have their own words, 3–10
// take the plural, 11+ go back to the singular. Spoken Saudi forms throughout.
function readingTimeLabel(mins: number, lang: Lang): string {
  if (lang === 'en') return `${mins} min read`
  if (mins === 1) return 'دقيقة قراءة'
  if (mins === 2) return 'دقيقتين قراءة'
  const n = arabicDigits.format(mins)
  return mins <= 10 ? `${n} دقايق قراءة` : `${n} دقيقة قراءة`
}

const mdxComponents = {
  hr: () => (
    <div className="prose-divider" aria-hidden="true">
      * * *
    </div>
  ),
}

export async function generateStaticParams({
  params,
}: {
  params: { lang: string }
}) {
  const { lang } = params
  if (!isLang(lang)) return []
  return getMdxSlugs(lang).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { lang, slug } = await params
  if (!isLang(lang)) notFound()

  const article = getMdxBySlug(lang, slug)
  if (!article) notFound()

  const { frontmatter } = article
  const canonical = `${SITE_URL}/${lang}/${slug}`
  const ogImage = frontmatter.ogImage ?? '/og/default.png'
  const locale = lang === 'ar' ? 'ar_SA' : 'en_US'
  const altLocale = lang === 'ar' ? 'en_US' : 'ar_SA'

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    alternates: {
      canonical,
      languages: {
        ar: `${SITE_URL}/ar/${slug}`,
        en: `${SITE_URL}/en/${slug}`,
      },
    },
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      url: canonical,
      type: 'article',
      locale,
      alternateLocale: altLocale,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: frontmatter.title,
      description: frontmatter.description,
      images: [ogImage],
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { lang, slug } = await params
  if (!isLang(lang)) notFound()

  const article = getMdxBySlug(lang, slug)
  if (!article) notFound()

  const { frontmatter, content } = article
  const nextArticle = getNextArticle(lang, slug)
  const canonicalUrl = `${SITE_URL}/${lang}/${slug}`

  const readLabel = readingTimeLabel(readingTimeMin(content, lang), lang)
  const metaText = `${formatArticleDate(frontmatter.date, lang)} · ${readLabel}`

  return (
    <>
      <Header lang={lang} slug={slug} />
      <main className="article-page">
        <h1 className="article-title">{frontmatter.title}</h1>
        <p className="article-meta">{metaText}</p>

        <article className="prose">
          <MDXRemote source={content} components={mdxComponents} />
        </article>

        <InstagramDmCTA lang={lang} />
        <ShareBar title={frontmatter.title} url={canonicalUrl} lang={lang} />
        <NextArticleCTA next={nextArticle} lang={lang} />
      </main>
      <Footer lang={lang} />
      <ScrollDepth slug={slug} lang={lang} />
    </>
  )
}
