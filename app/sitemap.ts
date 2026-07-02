import type { MetadataRoute } from 'next'
import { getMdxSlugs } from '@/lib/mdx'
import { SITE_URL } from '@/lib/site'

const LANGS = ['ar', 'en'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const lang of LANGS) {
    entries.push({
      url: `${SITE_URL}/${lang}`,
      lastModified: new Date(),
      alternates: {
        languages: {
          ar: `${SITE_URL}/ar`,
          en: `${SITE_URL}/en`,
        },
      },
    })

    const slugs = getMdxSlugs(lang)
    for (const slug of slugs) {
      entries.push({
        url: `${SITE_URL}/${lang}/${slug}`,
        lastModified: new Date(),
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
