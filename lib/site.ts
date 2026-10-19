export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thelongthought.com'

// Single source for the author's accounts: the footer, the DM call-to-action
// and any future profile links all read from here.
const INSTAGRAM_USERNAME = 'shotaroo.20'
const TIKTOK_USERNAME = 'shotaro.20'

export const SOCIAL_LINKS = {
  instagram: `https://www.instagram.com/${INSTAGRAM_USERNAME}/`,
  // ig.me opens the DM thread directly in the Instagram app on mobile.
  instagramDm: `https://ig.me/m/${INSTAGRAM_USERNAME}`,
  tiktok: `https://www.tiktok.com/@${TIKTOK_USERNAME}`,
} as const
