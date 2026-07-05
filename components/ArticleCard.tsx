import Link from 'next/link'
import { formatArticleDate, type ArticleListItem, type Lang } from '@/lib/mdx'

type Props = {
  article: ArticleListItem
  lang: Lang
}

export function ArticleCard({ article, lang }: Props) {
  return (
    <Link href={`/${lang}/${article.slug}`} className="card">
      <div className="card-main">
        <p className="card-meta">{formatArticleDate(article.date, lang)}</p>
        <h2 className="card-title">{article.title}</h2>
        {article.excerpt && (
          <p className="card-desc">{article.excerpt}</p>
        )}
      </div>
      <span className="card-arrow" aria-hidden="true">
        →
      </span>
    </Link>
  )
}
