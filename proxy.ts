import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { LANGS, negotiateLang } from '@/lib/i18n'

const LOCALES: readonly string[] = LANGS

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (!hasLocale) {
    // Arabic browsers get Arabic, English browsers English, everyone else
    // English. Links that already carry a locale (/ar/..., /en/...) are never
    // overridden, so shared article links open in the language they were sent in.
    const lang = negotiateLang(request.headers.get('accept-language'))
    const url = request.nextUrl.clone()
    url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`
    const response = NextResponse.redirect(url)
    // The target depends on the request header, so no cache may reuse it across visitors.
    response.headers.set('Vary', 'Accept-Language')
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  }

  return NextResponse.next()
}

export const config = {
  // Skip: api routes, Next internals, and any path with a file extension
  // (robots.txt, sitemap.xml, /og/*.png, icons, etc.) so metadata routes and
  // static assets are NOT redirected into the locale segment.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
