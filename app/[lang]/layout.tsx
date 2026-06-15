import { GoogleAnalytics } from '@next/third-parties/google'

export async function generateStaticParams() {
  return [{ lang: 'ar' }, { lang: 'en' }]
}

type Props = {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function LangLayout({ children, params: _params }: Props) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <>
      {children}
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </>
  )
}
