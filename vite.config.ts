
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Electron loads files from the filesystem, so absolute paths (starting with /) fail.
  // We use './' to make paths relative to index.html.
  base: './',
})