# Full Admin & Feature Expansion Plan

Bahut bada scope hai — isliye step-by-step plan dikha raha hu approval ke liye. Approve karne ke baad sab implement kar dunga.

## 1. Database (new tables via migration)

- **custom_downloads** — `tmdb_id`, `media_type` (movie/tv), `season`, `episode`, `label`, `url`, `quality`, `size`, `sort_order`, `enabled`
- **live_tv_channels** — `name`, `logo_url`, `stream_url`, `category`, `is_m3u_playlist`, `sort_order`, `enabled`
- **custom_pages** — `slug`, `title`, `content_html`, `meta_description`, `enabled`
- **site_settings** ko extend (naye keys): SEO defaults, analytics IDs (GA, GTM, FB pixel, Search Console), JSON-LD, social links (fb, ig, yt, twitter, telegram), push/onesignal id, razorpay key/secret-id, UPI id/name, custom_css, player_logo_url

## 2. Admin Panel — Full Restructure (sidebar layout)

Tabs/sections:
- **Dashboard** — counts
- **Site Identity** — title, logo, favicon, tagline
- **SEO Settings** — default meta title/desc, OG image, keywords
- **Analytics & Verification** — GA4, GTM, FB Pixel, Search Console, Bing
- **Structured Data** — JSON-LD textareas (Organization, Website)
- **Social Links** — all socials
- **Push & Ads** — OneSignal app id, header/footer/post-player banner HTML
- **Razorpay** — key id, key secret
- **UPI Payments** — UPI ID, name, QR url
- **Custom CSS** — global CSS injection
- **Servers** (existing, improved)
- **Ads Manager** (existing, improved + new slots: post_player_info, banner)
- **Custom Downloads** — search TMDB by title → save with custom links per movie/episode
- **Live TV** — add channels manually OR upload/paste M3U playlist (parsed and bulk-saved)
- **Custom Pages** — create pages with slug + HTML, accessible at `/page/:slug`
- **Change Password**
- **Default admin** — keep current auto-admin-on-first-signup

## 3. Frontend Pages/Components

- **`/live-tv`** — channel grid + sticky bottom player (HLS.js for m3u8)
- **`/page/:slug`** — render custom pages
- **`/filter`** — already exists, enhance with: genre, type, year, original_language, popularity (sort), region
- **Watch Providers page** — add filter UI (genre, type, year, language, popularity)
- **DetailPage** — fetch `custom_downloads` for this tmdb_id and render download buttons section
- **PlayerPage** — episode thumbnails (TMDB still_path) + player logo overlay from settings; add ad slot `post_player_info`
- **AppLayout** — inject custom_css, header/footer HTML, analytics scripts, OneSignal, JSON-LD
- **Genre shortcode** — `<GenreSlider genreId=... type=... title=...>` component usable in custom pages via simple `[genre id=28 type=movie]` parser, plus directly in Home

## 4. New ad slots
`post_player_info`, `banner_top`, `banner_bottom` added to AD_SLOTS

## 5. Tech notes
- HLS playback: `hls.js` for m3u8
- M3U parser: simple regex client-side
- Custom downloads: TMDB search inside admin to attach correct tmdb_id
- All settings cached via existing `siteSettings.ts`, extend defaults

---

Ye scope confirm karo, phir main pura implement kar dunga (kaafi files — ~15-20 new/edited). Agar kuch drop/add karna hai bolo.