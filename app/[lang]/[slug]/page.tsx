import type { Metadata } from 'next'
import { formatArticleDate, formatArticleDateLong, getMdxBySlug, getMdxSlugs, getNextArticle } from '@/lib/mdx'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ScrollDepth } from '@/components/ScrollDepth'
import { ShareBar } from '@/components/ShareBar'
import { NextArticleCTA } from '@/components/NextArticleCTA'
import type { Lang } from '@/lib/mdx'

type Params = { lang: string; slug: string }

function readingTimeMin(text: string, lang: 'ar' | 'en'): number {
  const wpm = lang === 'ar' ? 180 : 238
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / wpm))
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
  return getMdxSlugs(lang as Lang).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { lang, slug } = await params
  const { frontmatter } = getMdxBySlug(lang as Lang, slug)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'
  const canonical = `${siteUrl}/${lang}/${slug}`
  const ogImage = frontmatter.ogImage ?? '/og/default.png'
  const locale = lang === 'ar' ? 'ar_SA' : 'en_US'
  const altLocale = lang === 'ar' ? 'en_US' : 'ar_SA'

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    alternates: {
      canonical,
      languages: {
        ar: `${siteUrl}/ar/${slug}`,
        en: `${siteUrl}/en/${slug}`,
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
  const { frontmatter, content } = getMdxBySlug(lang as Lang, slug)
  const nextArticle = getNextArticle(lang as Lang, slug)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'
  const canonicalUrl = `${siteUrl}/${lang}/${slug}`

  const mins = readingTimeMin(content, lang as 'ar' | 'en')
  const readLabel = `${mins} min read`
  const metaText =
    lang === 'ar'
      ? formatArticleDateLong(frontmatter.date, 'ar')
      : `${formatArticleDate(frontmatter.date, 'en')} · ${readLabel}`

  return (
    <>
      <Header lang={lang as Lang} slug={slug} />
      <main className="article-page">
        <h1 className="article-title">{frontmatter.title}</h1>
        <p className="article-meta">{metaText}</p>

        <article className="prose">
          <MDXRemote source={content} components={mdxComponents} />
        </article>

        <ShareBar title={frontmatter.title} url={canonicalUrl} lang={lang} />
        <NextArticleCTA next={nextArticle} lang={lang as Lang} />
      </main>
      <Footer lang={lang as Lang} />
      <ScrollDepth slug={slug} lang={lang} />
    </>
  )
}
