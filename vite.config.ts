import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/services/background.ts') // Make sure this path is correct
      },
      output: {
        entryFileNames: "[name].js", // Forces the output to be exactly "background.js"
      },
    },
  },
});
