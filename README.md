
# bezrealit.eu — Bilingual + Firebase MVP

This package adds **Czech/English i18n** and **Firebase scaffolding** to the static MVP.

## What changed
- Language switcher (Čeština / English) stored in `localStorage` + `?lang=` in URL.
- `assets/js/i18n.js` — translation dictionaries + DOM hydration via `data-i18n` attributes.
- Firebase integration using **modular v10 SDK** loaded from CDN.
- `assets/js/firebase-config.sample.js` — copy to `firebase-config.js` and fill your project keys.
- If Firebase is configured, listings load from Firestore (`collection('listings')`); else fall back to `/data/listings.json`.
- Login page wired for Email+Password and Google sign-in. Favorites demo writes to `users/{uid}/favorites/{listingId}`.

## Quick start
1. **Deploy** (Netlify Drop recommended): upload the folder contents.
2. **i18n**: Use the globe button in the navbar to switch CZ/EN.
3. **Firebase setup (optional)**
   - Create a Firebase project → Web app → copy config.
   - In `/assets/js/`, copy `firebase-config.sample.js` to `firebase-config.js` and paste your config.
   - In **Firestore** create a collection `listings` with documents that match `data/listings.json` fields.
   - (Optional) Enable **Authentication** (Email/Password and Google).

## Local preview
Run a static server (e.g., `python3 -m http.server 8080`) and open `http://localhost:8080`.

## Paths note
If hosting under a subpath (e.g., GitHub Pages), change absolute URLs (`/...`) to relative (`./...`). See `app.js` fetch if needed.
