import Link from 'next/link'
import type { Lang } from '@/lib/mdx'

type Props = {
  lang: Lang
  slug?: string
}

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'المنصة'

export function Header({ lang, slug }: Props) {
  const otherLang: Lang = lang === 'ar' ? 'en' : 'ar'
  const switchHref = slug ? `/${otherLang}/${slug}` : `/${otherLang}`

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href={`/${lang}`} className="site-name">
          {SITE_NAME}
        </Link>

        <nav className="header-nav">
          <Link href={`/${lang}`} className="nav-link">
            All articles
          </Link>

          <span className="nav-sep" aria-hidden="true">|</span>

          <div className="lang-switch">
            <Link
              href={lang === 'ar' ? '#' : switchHref}
              className="lang-btn"
              aria-current={lang === 'ar' ? 'true' : undefined}
              aria-label="Arabic"
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
