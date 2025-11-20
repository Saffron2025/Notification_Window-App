import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",                 // 🔥 THIS FIXES BLANK SCREEN
  build: {
    outDir: "dist",           // 🔥 React build will go to /dist
  }
});
