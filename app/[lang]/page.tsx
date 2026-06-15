import { getAllMdxFrontmatter } from '@/lib/mdx'
import { ArticleCard } from '@/components/ArticleCard'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import type { Lang } from '@/lib/mdx'

type Props = {
  params: Promise<{ lang: string }>
}

export default async function ArticleListPage({ params }: Props) {
  const { lang } = await params
  const articles = getAllMdxFrontmatter(lang as Lang)

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
            articles.map((article) => (
              <ArticleCard key={article.slug} article={article} lang={lang as Lang} />
            ))
          )}
        </div>
      </main>
      <Footer lang={lang as Lang} />
    </>
  )
}
