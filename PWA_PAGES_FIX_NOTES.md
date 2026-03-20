# Markdown Redactor 2.0 — PWA + GitHub Pages fix notes

## What changed

This package builds on the local-file-save patch and adds a practical PWA/GitHub Pages repair pass.

### 1) PWA assets moved to `public/`
Added:
- `public/manifest.webmanifest`
- `public/sw.js`
- `public/pwa-192x192.png`
- `public/pwa-512x512.png`
- `public/.nojekyll`

Why:
- Vite copies `public/` files to the root of `dist/` as-is.
- Static assets like a service worker, manifest, and install icons are safest there for GitHub Pages deployment.

### 2) HTML updated
Changed `index.html` to point to:
- `./manifest.webmanifest`
- `./pwa-192x192.png`

Removed the old inline service worker registration block from `index.html`.

### 3) Service worker registration moved into `index.tsx`
The app now registers `./sw.js` from the app entry point.

### 4) Offline behavior improved
The new service worker:
- precaches the app shell
- caches same-origin assets
- runtime-caches critical CDN dependencies used by this app:
  - `cdn.tailwindcss.com`
  - `cdnjs.cloudflare.com`
  - `fonts.googleapis.com`
  - `fonts.gstatic.com`
  - `esm.sh`

Important:
- offline mode is practical **after the first online visit**
- this is still a static GitHub Pages app, not a server-backed sync platform

### 5) Legacy root PWA files removed
Removed obsolete root files:
- `manifest.json`
- `sw.js`

They were replaced by the `public/` versions used for build output.

## Recommended deployment route

1. Replace your repo contents with this package.
2. Commit and push to `main`.
3. In GitHub repository settings, keep **Pages source = GitHub Actions**.
4. Let `.github/workflows/deploy.yml` build and publish `dist/`.
5. Open the deployed site once while online.
6. In Chrome, test:
   - install prompt / install option
   - reopen after install
   - offline reopen after first online load
   - open local markdown file
   - edit
   - save back to same file

## What this does NOT solve yet

- fully local bundled Tailwind instead of CDN usage
- app-store style polish
- background sync
- conflict handling for multi-tab file edits
- true multi-file local directory workspace persistence

## Best next step after this patch

If this deploy works, the next real upgrade should be:
**replace CDN Tailwind/runtime assets with local bundled assets**

That will make offline behavior more deterministic and reduce dependency on third-party CDNs.
