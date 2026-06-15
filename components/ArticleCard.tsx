import Link from 'next/link'
import type { Frontmatter, Lang } from '@/lib/mdx'

type Props = {
  article: Frontmatter
  lang: Lang
}

export function ArticleCard({ article, lang }: Props) {
  return (
    <article className="article-card">
      <Link href={`/${lang}/${article.slug}`} className="article-card-title">
        {article.title}
      </Link>
      <p className="article-card-date">{article.date}</p>
      {article.description && (
        <p className="article-card-desc">{article.description}</p>
      )}
    </article>
  )
}
