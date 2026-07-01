import Link from 'next/link'
import { formatArticleDate, type Frontmatter, type Lang } from '@/lib/mdx'

type Props = {
  article: Frontmatter
  lang: Lang
}

export function ArticleCard({ article, lang }: Props) {
  return (
    <Link href={`/${lang}/${article.slug}`} className="card">
      <div className="card-main">
        <p className="card-meta">{formatArticleDate(article.date, lang)}</p>
        <h2 className="card-title">{article.title}</h2>
        {article.description && (
          <p className="card-desc">{article.description}</p>
        )}
      </div>
      <span className="card-arrow" aria-hidden="true">
        →
      </span>
    </Link>
  )
}
