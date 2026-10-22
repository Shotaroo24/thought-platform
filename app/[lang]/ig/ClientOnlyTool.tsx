'use client'

import dynamic from 'next/dynamic'

// The tool measures text in the DOM and keeps its draft in localStorage, so a
// server render would have nothing to show and would mismatch on hydration.
export const ClientOnlyTool = dynamic(
  () => import('./PostImageTool').then((mod) => mod.PostImageTool),
  { ssr: false }
)
