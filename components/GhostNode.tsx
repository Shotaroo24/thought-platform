import type { Lang } from '@/lib/mdx'

const GHOST_TEXT: Record<Lang, string> = {
  en: 'the next article is coming soon…',
  ar: 'المقال الجاي قريب…',
}

// Placeholder that always renders last in the timeline, signalling that the
// series continues. Not a link — remove once the archive has enough entries
// that an empty tail no longer needs announcing.
export function GhostNode({ lang }: { lang: Lang }) {
  return (
    <div className="ghost-node">
      <p className="ghost-node-text">{GHOST_TEXT[lang]}</p>
    </div>
  )
}
