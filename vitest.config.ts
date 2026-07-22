import { defineConfig } from "vitest/config"
import { loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
    // Modules like lib/db call neon(process.env.DATABASE_URL) at import time,
    // so .env.local has to be loaded before any test imports them.
    env: loadEnv(mode, process.cwd(), ""),
  },
}))
