import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { LANGS, chooseLang } from '@/lib/i18n'

const LOCALES: readonly string[] = LANGS

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (!hasLocale) {
    // Visitors in the Arab world get Arabic whatever their browser language;
    // elsewhere the browser decides, and no preference at all means Arabic.
    // Links that already carry a locale (/ar/..., /en/...) are never
    // overridden, so shared article links open in the language they were sent in.
    const lang = chooseLang(
      request.headers.get('accept-language'),
      // Set by Vercel's edge from the client IP; absent in local dev.
      request.headers.get('x-vercel-ip-country')
    )
    const url = request.nextUrl.clone()
    url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`
    const response = NextResponse.redirect(url)
    // The target depends on request headers, so no cache may reuse it across visitors.
    response.headers.set('Vary', 'Accept-Language, X-Vercel-IP-Country')
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
