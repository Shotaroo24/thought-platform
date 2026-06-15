import Link from 'next/link'
import type { Frontmatter, Lang } from '@/lib/mdx'

type Props = {
  next: Frontmatter | null
  lang: Lang
}

const LABEL = {
  next: { ar: 'المقالة التالية', en: 'Next article' },
}

export function NextArticleCTA({ next, lang }: Props) {
  if (!next) return null

  return (
    <div className="next-cta">
      <span className="next-cta-label">{LABEL.next[lang]}</span>
      <Link href={`/${lang}/${next.slug}`} className="next-cta-link">
        {next.title}
        <span className="next-cta-arrow" aria-hidden="true">→</span>
      </Link>
    </div>
  )
}
