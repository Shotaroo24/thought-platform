import Link from 'next/link'
import type { Frontmatter, Lang } from '@/lib/mdx'

type Props = {
  article: Frontmatter
  lang: Lang
}

export function ArticleCard({ article, lang }: Props) {
  return (
    <Link href={`/${lang}/${article.slug}`} className="article-card">
      <div className="article-card-main">
        <p className="article-card-date">{article.date}</p>
        <h2 className="article-card-title">{article.title}</h2>
        {article.description && (
          <p className="article-card-desc">{article.description}</p>
        )}
      </div>
      <span className="article-card-arrow" aria-hidden="true">
        {lang === 'ar' ? '←' : '→'}
      </span>
    </Link>
  )
}
