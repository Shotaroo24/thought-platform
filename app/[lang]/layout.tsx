import type { Metadata } from 'next'
import { Newsreader, Markazi_Text, IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import { SITE_URL } from '@/lib/site'
import '@/app/globals.css'

const newsreader = Newsreader({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-newsreader',
  preload: true,
})

const markaziText = Markazi_Text({
  weight: ['400', '500', '600', '700'],
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-markazi',
  preload: true,
})

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  weight: ['400', '500', '600'],
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-sans-ar',
})

export async function generateStaticParams() {
  return [{ lang: 'ar' }, { lang: 'en' }]
}

type Props = {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params

  const title = {
    default: 'The Long Thought',
    template: '%s | The Long Thought',
  }
  const description =
    lang === 'ar' ? 'منصة فكرية للكتابة العميقة' : 'A platform for deep, slow writing.'
  const locale = lang === 'ar' ? 'ar_SA' : 'en_US'

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      title,
      description,
      url: SITE_URL,
      type: 'website',
      locale,
      images: [{ url: '/og/default.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: title.default,
      description,
      images: ['/og/default.png'],
    },
  }
}

export default async function LangLayout({ children, params }: Props) {
  const { lang } = await params
  const isRtl = lang === 'ar'
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <html
      lang={lang}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`${newsreader.variable} ${markaziText.variable} ${ibmPlexSans.variable} ${ibmPlexSansArabic.variable}`}
    >
      <body>
        {children}
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  )
}
