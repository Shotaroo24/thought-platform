import Link from 'next/link'
import type { Lang } from '@/lib/mdx'
import { SOCIAL_LINKS } from '@/lib/site'

type Props = {
  lang: Lang
}

export function Footer({ lang }: Props) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner shell">
        <div className="footer-start">
          <Link href={`/${lang}`} className="footer-logo">
            the long thought
          </Link>
          <span className="footer-copy">© 2026</span>
        </div>
        <div className="footer-end">
          <div className="footer-social">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Instagram
            </a>
            <a
              href={SOCIAL_LINKS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              TikTok
            </a>
          </div>
          <a href="mailto:shotaro21.info@gmail.com" className="footer-link">
            shotaro21.info@gmail.com
          </a>
        </div>
      </div>
    </footer>
  )
}
