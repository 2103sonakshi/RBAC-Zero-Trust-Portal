import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        // REMOVE THE REWRITE LINE OR COMMENT IT OUT
        // rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
