import Link from 'next/link'
import type { Frontmatter } from '@/lib/mdx'
import type { Lang } from '@/lib/i18n'

type Props = {
  next: Frontmatter | null
  lang: Lang
}

const LABEL = {
  next: { ar: 'المقال الجاي', en: 'Next article' },
} satisfies Record<string, Record<Lang, string>>

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
