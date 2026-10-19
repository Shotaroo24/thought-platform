import type { NextConfig } from "next";

// 'unsafe-eval' is only needed in dev mode: Turbopack/React use eval() for
// stack-trace reconstruction there. React never uses eval() in production,
// so the production CSP stays eval-free.
//
// 'unsafe-inline' stays in script-src: Next's hydration bootstrap and the GA4
// snippet are inline scripts, and the nonce alternative requires a per-request
// nonce from the proxy, which would opt every page out of static rendering.
// Trade-off accepted while the site renders no user-supplied HTML.
const isProd = process.env.NODE_ENV === 'production'

const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com"

// The dev overlay and HMR spin up blob workers; production ships none.
const workerSrc = isProd ? "'none'" : "'self' blob:"

const contentSecurityPolicy = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self'",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
  // Nothing on this site loads plugins, iframes, workers or a manifest, so the
  // fetch directives default-src doesn't cover are closed explicitly.
  "object-src 'none'",
  "frame-src 'none'",
  `worker-src ${workerSrc}`,
  "manifest-src 'self'",
  "media-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ')

// Every browser feature the site never uses is denied, so a future injected
// script can't reach the camera, mic, location or payment APIs.
const permissionsPolicy = [
  'accelerometer=()',
  'autoplay=()',
  'camera=()',
  'display-capture=()',
  'encrypted-media=()',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'midi=()',
  'payment=()',
  'usb=()',
  'xr-spatial-tracking=()',
].join(', ')

const nextConfig: NextConfig = {
  // Hide the framework/version banner from responses.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Backstop for browsers that ignore frame-ancestors.
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: permissionsPolicy },
          // Severs the window.opener relationship for anything we open or that
          // opens us, so a popup can't reach back into this origin.
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
};

export default nextConfig;
