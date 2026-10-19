export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thelongthought.com'

// Single source for the author's accounts: the footer, the DM call-to-action
// and any future profile links all read from here.
const INSTAGRAM_USERNAME = 'shotaroo.20'
const TIKTOK_USERNAME = 'shotaro.20'

// There is deliberately no direct DM link (ig.me/m/<user>). Most readers come
// from Instagram's in-app browser, where that link hops through redirects into
// the web DM view and the back button lands on a redirect again, so readers
// can't return to the article. The profile page has no redirect, and its
// "Message" button is one tap away.
export const SOCIAL_LINKS = {
  instagram: `https://www.instagram.com/${INSTAGRAM_USERNAME}/`,
  tiktok: `https://www.tiktok.com/@${TIKTOK_USERNAME}`,
} as const
