import path from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@renderer": path.resolve(__dirname, "src/renderer/src"),
        "basics-os/src": path.resolve(__dirname, "src"),
      },
    },
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": { target: "http://localhost:3001", changeOrigin: true },
        "/assistant": { target: "http://localhost:3001", changeOrigin: true },
      },
    },
  },
});
