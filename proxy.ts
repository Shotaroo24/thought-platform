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

  const locale =
    LOCALES.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`) ??
    DEFAULT_LOCALE

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-locale', locale)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
