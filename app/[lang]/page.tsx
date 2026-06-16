import Link from 'next/link'
import { getAllMdxFrontmatter } from '@/lib/mdx'
import { ArticleCard } from '@/components/ArticleCard'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import type { Lang } from '@/lib/mdx'

type Props = {
  params: Promise<{ lang: string }>
}

const START_HERE: Record<Lang, string> = {
  en: 'Start here',
  ar: 'ابدأ من هنا',
}

export default async function ArticleListPage({ params }: Props) {
  const { lang } = await params
  const articles = getAllMdxFrontmatter(lang as Lang)
  const pinned = articles.filter((a) => a.pinned)
  const rest = articles.filter((a) => !a.pinned)

  return (
    <>
      <Header lang={lang as Lang} />
      <main>
        <div className="article-list">
          {articles.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>
              {lang === 'ar' ? 'لا توجد مقالات بعد.' : 'No articles yet.'}
            </p>
          ) : (
            <>
              {pinned.map((article) => (
                <Link
                  key={article.slug}
                  href={`/${lang}/${article.slug}`}
                  className="card pinned"
                >
                  <div className="card-main">
                    <p className="card-label">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M14 2l1 1-1 5 4 4v2h-5v6l-1 1-1-1v-6H6v-2l4-4-1-5 1-1z" />
                      </svg>
                      {START_HERE[lang as Lang]}
                    </p>
                    <h2 className="card-title">{article.title}</h2>
                    {article.description && (
                      <p className="card-desc">{article.description}</p>
                    )}
                  </div>
                </Link>
              ))}
              <div className="journey">
                {rest.map((article) => (
                  <ArticleCard key={article.slug} article={article} lang={lang as Lang} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer lang={lang as Lang} />
    </>
  )
}
