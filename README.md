# ZeusV2 — Static Site

Landing + account + profile pages with a liquid-glass UI. Pure HTML/CSS/JS, no build step.

## Files
- `index.html` — main landing page (Home / Showcase / Pricing)
- `account.html` — sign in / register
- `profile.html` — user profile, subscription management
- `showcase.jfif` — showcase image
- `pfp.jpg` — default profile avatar
- `.nojekyll` — disables GitHub Pages Jekyll processing (keeps assets/names intact)

## Deploy to GitHub Pages

1. Create a repository on GitHub.
2. Upload these files to the repository root (keep them in the same folder):
   - `index.html`, `account.html`, `profile.html`
   - `showcase.jfif`, `pfp.jpg`
   - `.nojekyll`
3. In the repo go to **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Pick the branch (`main` or `master`) and the `/ (root)` folder, then **Save**.
6. Wait ~1 minute. Your site will be live at:
   `https://<your-username>.github.io/<repository-name>/`

> The site works from a subpath (e.g. `/<repo>/`) because all links are relative
> (`index.html`, `account.html`, `profile.html`, `showcase.jfif`, `pfp.jpg`).
> The `.nojekyll` file ensures GitHub does not strip files during publishing.

## Notes
- Accounts/subscriptions are stored in the browser's `localStorage` (per-device, demo only).
- Fonts are loaded from Google Fonts, so an internet connection is required for the exact typography.