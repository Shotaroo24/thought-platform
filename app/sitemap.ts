import type { MetadataRoute } from 'next'
import { LANGS } from '@/lib/i18n'
import { getAllMdxFrontmatter } from '@/lib/mdx'
import { SITE_URL } from '@/lib/site'

// lastModified comes from the article dates, not the build time: a rebuild
// that changes no article shouldn't tell crawlers every page changed.
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const lang of LANGS) {
    const articles = getAllMdxFrontmatter(lang) // newest-first

    entries.push({
      url: `${SITE_URL}/${lang}`,
      ...(articles.length > 0 ? { lastModified: articles[0].date } : {}),
      alternates: {
        languages: {
          ar: `${SITE_URL}/ar`,
          en: `${SITE_URL}/en`,
        },
      },
    })

    for (const { slug, date } of articles) {
      entries.push({
        url: `${SITE_URL}/${lang}/${slug}`,
        lastModified: date,
        alternates: {
          languages: {
            ar: `${SITE_URL}/ar/${slug}`,
            en: `${SITE_URL}/en/${slug}`,
          },
        },
      })
    }
  }

  return entries
}
