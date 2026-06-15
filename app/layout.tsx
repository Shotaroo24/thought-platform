import type { Metadata } from 'next'
import { Markazi_Text, IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from 'next/font/google'
import { headers } from 'next/headers'
import '@/app/globals.css'

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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'),
  title: {
    default: 'المنصة الفكرية',
    template: '%s | المنصة الفكرية',
  },
  description: 'منصة فكرية للكتابة العميقة',
}

const DEFAULT_LOCALE = 'ar'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const locale = headersList.get('x-locale') ?? DEFAULT_LOCALE
  const isRtl = locale === 'ar'

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`${markaziText.variable} ${ibmPlexSans.variable} ${ibmPlexSansArabic.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
