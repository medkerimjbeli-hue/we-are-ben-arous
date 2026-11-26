export type InstagramPostType = 'reel' | 'post' | 'tv';

/** Parses a supplied Instagram URL without modifying it. Returns null when it is not an Instagram post URL. */
export function parseInstagramUrl(url: string): { type: InstagramPostType; shortcode: string; permalink: string } | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (u.protocol !== 'https:' || !/(^|\.)instagram\.com$/.test(u.hostname)) return null;
  const m = u.pathname.match(/^\/(reel|reels|p|tv)\/([A-Za-z0-9_-]+)\/?$/);
  if (!m) return null;
  const type: InstagramPostType = m[1] === 'p' ? 'post' : m[1] === 'tv' ? 'tv' : 'reel';
  const seg = m[1] === 'reels' ? 'reel' : m[1];
  // The canonical permalink is only used for the embed widget; links always use the original URL.
  return { type, shortcode: m[2], permalink: `https://www.instagram.com/${seg}/${m[2]}/` };
}

export const INSTAGRAM_PROFILE = 'https://www.instagram.com/we_are_ben_arous/';
