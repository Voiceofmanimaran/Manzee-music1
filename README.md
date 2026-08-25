# Manzee Music

A simple Supabase-backed music library and Cloudinary audio player.

## Setup

1. In Supabase Dashboard, open **SQL Editor** and run [`supabase.sql`](supabase.sql).
2. Confirm the table policies are enabled. This starter admin panel is intentionally open for simplicity; add authentication before production use.
3. Open [`index.html`](index.html) in a browser, or serve this folder with any static server.
4. Use **Add song** to save a title, artist, album, cover image URL, and Cloudinary audio URL.

The Supabase project URL and publishable anon key are configured in `app.js`. Songs are loaded from the `songs` table; no songs are hardcoded in the frontend.
