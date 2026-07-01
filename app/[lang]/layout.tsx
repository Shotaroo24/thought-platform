import type { Metadata } from 'next'
import { Newsreader, Markazi_Text, IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
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

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'),
    title: {
      default: 'The Long Thought',
      template: '%s | The Long Thought',
    },
    description:
      lang === 'ar' ? 'منصة فكرية للكتابة العميقة' : 'A platform for deep, slow writing.',
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
