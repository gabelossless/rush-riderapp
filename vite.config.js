import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    globals: true,
    // Vitest's default excludes don't cover .claude/ — without this, a
    // `.claude/worktrees/<agent>/` scratch checkout (Claude Code's Agent
    // tool with isolation: "worktree") gets recursed into and its copy of
    // the whole test suite runs a second (or third...) time alongside the
    // real one.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{git,cache,output,temp}/**', '**/.claude/**'],
  },
  server: {
    // Bind to 0.0.0.0 (not just localhost) and accept any Host header so the
    // dev server is reachable through cloud/remote preview proxies (Claude
    // Code on the web, Codespaces, etc.) — without this, requests through a
    // forwarded preview domain are rejected and the app never mounts,
    // showing a black screen.
    host: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Rush Rideshare',
        short_name: 'Rush',
        description: 'Next-Gen Investor Rideshare Demo',
        theme_color: '#090A0F',
        background_color: '#090A0F',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        // The MapEngine chunk is large and the map is network-dependent
        // (remote tiles) anyway — keep it out of the precache so the app
        // shell + landing page install instantly and the map loads on demand.
        globIgnores: ['**/assets/MapEngine-*'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
      },
    }),
  ],
})
