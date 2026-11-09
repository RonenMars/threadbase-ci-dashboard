# Capacitor mobile shell

Native iOS/Android wrapper for the Threadbase CI dashboard.

## Why a remote URL (not a static export)

This app depends on Auth.js, API routes, and server-rendered pages. Capacitor therefore loads the live Next.js deployment in a WebView instead of packaging a static `out/` build.

Default URL: `https://threadbase-ci-dashboard.vercel.app` (see `capacitor.config.ts`).

## Prerequisites

- Xcode (iOS) and/or Android Studio (Android)
- A physical device or simulator
- For a physical iPhone: Apple ID signing in Xcode (Personal Team is enough for your own device)

## First-time setup

```bash
npm install
npx cap sync
```

Native projects live in `ios/` and `android/` after `npx cap add`.

## Run on your phone (production site)

Loads the deployed Vercel app inside the native shell:

```bash
npm run cap:sync
npm run cap:ios          # opens Xcode — pick your device, Run
# or
npm run cap:run:ios      # CLI deploy to a connected device/simulator
```

Android:

```bash
npm run cap:sync
npm run cap:android
# or
npm run cap:run:android
```

## Run against local `next dev`

1. Start Next on all interfaces: `npm run dev -- --hostname 0.0.0.0`
2. Point Capacitor at your Mac’s LAN IP (same Wi‑Fi as the phone):

```bash
CAPACITOR_SERVER_URL=http://192.168.x.x:3000 npm run cap:sync
npm run cap:ios
```

Use HTTPS/`*.vercel.app` again for production builds by omitting `CAPACITOR_SERVER_URL` and re-running `cap:sync`.

## Notes

- GitHub OAuth must stay inside the WebView; `allowNavigation` already includes `github.com` and Vercel hosts.
- This is a WebView shell, not an offline/native rewrite. Network access is required.
- App Store review of pure WebView wrappers can be strict; sideloading / TestFlight for personal use is the intended path here.
