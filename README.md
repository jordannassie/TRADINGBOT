# TradingBot

This repository is currently configured for a Netlify deployment. Update the build command, publish directory, and environment variables below once your front-end app exists.

## Netlify setup

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Redirects**: all routes fall back to `index.html` for SPA routing.
- Add any additional environment variables via Netlify's dashboard or CLI. Keep secrets out of source control; use `.env` files locally and configure them in Netlify (e.g., `NETLIFY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`).

## Supabase setup

1. Create a Supabase project and note the `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
2. Store those values in your development `.env` file (ignored by `.gitignore`) and configure the same keys as Netlify environment variables.
3. If you use Supabase migrations, keep them under a `supabase/migrations` directory and run `supabase db push` or `supabase db diff` as needed before committing.

## Next steps

1. Add your application source code (frontend/backend).
2. Ensure `package.json` includes the actual build script Netlify should run.
3. Commit your changes and push to trigger Netlify deploy previews.
