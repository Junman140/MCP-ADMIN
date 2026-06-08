import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/cbt-api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/cbt-api/, "/api/v1"),
      },
      "/api/v1": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/api": {
        target: "http://127.0.0.1:4111",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
