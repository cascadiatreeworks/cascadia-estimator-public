# Cascadia Tree Works Estimator

Mobile field estimator for Cascadia Tree Works.

## What It Does

- Builds professional tree service estimates on a phone
- Scores job difficulty and risk
- Calculates low, recommended, and premium pricing
- Warns when a job may be underbid
- Saves estimates in browser local storage
- Supports print / save-as-PDF export
- Includes first-pass dictation support where the browser allows it
- Can be installed as a mobile web app after hosting

## GitHub Pages

This is a static web app. It can be hosted directly from the repository root with GitHub Pages.

Recommended Pages settings:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/root`

After GitHub Pages publishes, open the Pages URL on your phone and choose `Add to Home Screen`.

## Files

- `index.html` - app shell and mobile web app metadata
- `styles.css` - mobile-first app styling
- `app.js` - estimator logic, pricing, saved estimates, dictation
- `manifest.webmanifest` - installable web app manifest
- `sw.js` - offline app cache
- `assets/` - Cascadia logo and app icons
