import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ClientOnlyTool } from './ClientOnlyTool'

type Props = {
  params: Promise<{ lang: string }>
}

export const dynamicParams = false

export const metadata: Metadata = {
  title: 'Instagram post images',
  robots: { index: false, follow: false },
}

// A writing tool for the author, not a page for readers: it exists only under
// `next dev`, and only in Arabic because the Instagram posts are Arabic only.
export default async function InstagramPostImagesPage({ params }: Props) {
  const { lang } = await params
  if (process.env.NODE_ENV === 'production' || lang !== 'ar') notFound()

  return <ClientOnlyTool />
}
