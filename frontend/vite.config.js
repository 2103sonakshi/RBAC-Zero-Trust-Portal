import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "RBAC Zero-Trust Portal",
        short_name: "RBAC Portal",
        description: "Role-Based Access Control with Blockchain Audit Trail",
        theme_color: "#3b82f6",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg/shield-lock.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg/shield-lock.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "external-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
      "/health": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
      "/health": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
