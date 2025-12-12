import { defineConfig } from 'vite'
import NoctesPlugin from 'noctes.jsx-vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [NoctesPlugin()],
  base: "/",
  build: {
    outDir: "./dist",
    emptyOutDir: true
  }
})