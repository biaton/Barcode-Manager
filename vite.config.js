import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src-renderer',
  publicDir: '../public',
  base: './', // Use relative paths for Electron
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow external connections
    cors: true,      // Enable CORS for network access
    open: false      // Don't auto-open browser (since we're running Electron)
  }
})