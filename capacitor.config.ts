import type { CapacitorConfig } from "@capacitor/cli";

/**
 * This Next.js app needs a server (Auth.js, API routes, SSR), so the native
 * shell loads the deployed (or local) URL instead of a static export.
 *
 * Override for local device testing against `next dev`:
 *   CAPACITOR_SERVER_URL=http://192.168.x.x:3000 npx cap sync
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL ??
  "https://threadbase-ci-dashboard.vercel.app";

const isCleartext = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "com.threadbase.cidashboard",
  appName: "Threadbase CI",
  webDir: "mobile/www",
  server: {
    url: serverUrl,
    cleartext: isCleartext,
    // Keep OAuth + Vercel preview hosts inside the WebView.
    allowNavigation: [
      "threadbase-ci-dashboard.vercel.app",
      "*.vercel.app",
      "github.com",
      "*.github.com",
    ],
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
