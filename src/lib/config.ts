// Public runtime configuration (safe for the browser). Kept free of heavy imports so the
// public site does not download the Supabase client unless a backend is configured.
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('YOUR-PROJECT-REF'));
export const MEDIA_BUCKET = 'media';

/** Public URL of a file in the public media bucket (no client needed). */
export function mediaPublicUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  if (!SUPABASE_URL) return '';
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
}
