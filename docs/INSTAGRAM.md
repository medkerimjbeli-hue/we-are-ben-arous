# Instagram integration

## What's live now (no credentials needed)

- The 10 owner-supplied URLs are stored **exactly as supplied** (`src/data/seed.json` and `supabase/seed.sql`), and tests check them character by character against `reference-assets/content/Instagram ref.txt`.
- Reels (`/reel/`) and regular posts (`/p/`) are both detected. `/tv/` is also accepted.
- **Embeds** use Instagram's official `embed.js` and load only after the visitor clicks "Load post". This avoids contacting Meta before the visitor chooses to, and keeps pages fast. The embed widget uses the canonical permalink; every "View on Instagram" link uses the original URL.
- **Fallback:** if the script fails or no embed appears within 10 seconds (the post was deleted, made private or blocks embedding), the card says so and keeps its label and the original link.
- **Featured:** an admin picks up to 5 posts and positions 1–5; the database rejects duplicate positions. If no post is featured, the homepage shows "From our Instagram" in display order, **never** a ranking.
- **Links to places:** posts are linked to a delegation and, only when confirmed, to a place. Uncertain links stay unlinked with a review note, and the dashboard lists them.
- **Metrics:** optional. They can only be stored together with a type (views, plays, reach, likes, comments, shares, saves), a source and a verification date; the database enforces this. They're currently shown only in the dashboard, and the site never compares different metric types.

## What needs Meta credentials (not built)

Automatic thumbnails, captions and engagement numbers need the **Instagram Graph API** with a professional (Business or Creator) account that's connected to a Facebook Page, plus a Meta app with `instagram_basic` and `instagram_manage_insights` permissions, which go through Meta's app review. None of this can be done without your accounts, and scraping is not an option.

If you want it later, this is the design to follow:

1. Create the Meta app and generate a **long-lived token** for @we_are_ben_arous.
2. Store it as a Supabase secret: `npx supabase secrets set IG_ACCESS_TOKEN=…` (never in GitHub or `VITE_*` variables).
3. Write a Supabase **Edge Function** (`supabase/functions/instagram-sync`) that runs on a schedule. It should:
   - call `GET /{ig-user-id}/media?fields=id,permalink,media_type,thumbnail_url,timestamp`;
   - match results to `social_posts` by **shortcode** only, never by caption text;
   - call `GET /{media-id}/insights?metric=views,reach` (the available metrics depend on the media type);
   - write `metric_type`, `metric_value`, `metric_source = 'Instagram Graph API'` and `metric_verified_at = today` using the service role, which exists only inside the Edge Function.
4. Refresh the token before its ~60-day expiry, inside the function.
5. Thumbnails: if you store them, store the URL Meta returns (it expires). Re-hosting the media needs the creator's permission.

Until then, metrics can be entered by hand from Instagram Insights, with their source and date.
