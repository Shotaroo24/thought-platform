import Link from 'next/link'
import type { Lang } from '@/lib/mdx'

type Props = {
  lang: Lang
  slug?: string
}

const ALL_ARTICLES: Record<Lang, string> = {
  en: 'All articles',
  ar: 'كل المقالات',
}

export function Header({ lang, slug }: Props) {
  const otherLang: Lang = lang === 'ar' ? 'en' : 'ar'
  const switchHref = slug ? `/${otherLang}/${slug}` : `/${otherLang}`

  return (
    <header className="site-header">
      <div className="site-header-inner shell">
        <Link href={`/${lang}`} className="site-logo">
          the long thought
        </Link>

        <nav className="header-nav">
          <Link href={`/${lang}`} className="nav-link" aria-current="page">
            {ALL_ARTICLES[lang]}
          </Link>

          <div className="lang-switch" role="group" aria-label="Language">
            <Link
              href={lang === 'ar' ? '#' : switchHref}
              className="lang-btn"
              aria-current={lang === 'ar' ? 'true' : undefined}
              aria-label="العربية"
            >
              ع
            </Link>
            <Link
              href={lang === 'en' ? '#' : switchHref}
              className="lang-btn"
              aria-current={lang === 'en' ? 'true' : undefined}
              aria-label="English"
            >
              EN
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
