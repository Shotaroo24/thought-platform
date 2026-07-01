import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOCALES = ['ar', 'en']
const DEFAULT_LOCALE = 'ar'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (!hasLocale) {
    const url = request.nextUrl.clone()
    url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Skip: api routes, Next internals, and any path with a file extension
  // (robots.txt, sitemap.xml, /og/*.png, icons, etc.) so metadata routes and
  // static assets are NOT redirected into the locale segment.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
