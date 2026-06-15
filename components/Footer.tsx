import Link from 'next/link'
import type { Lang } from '@/lib/mdx'

type Props = {
  lang: Lang
}

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'المنصة'

export function Footer({ lang }: Props) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-start">
          <Link href={`/${lang}`} className="footer-wordmark">
            {SITE_NAME}
          </Link>
          <span className="footer-copy">© 2026</span>
        </div>
        <div className="footer-end">
          <div className="footer-social">
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Instagram
            </a>
            <span className="footer-dot" aria-hidden="true">·</span>
            <a
              href="https://www.tiktok.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              TikTok
            </a>
          </div>
          <a href="mailto:shotaro21.info@gmail.com" className="footer-link footer-email">
            shotaro21.info@gmail.com
          </a>
        </div>
      </div>
    </footer>
  )
}
