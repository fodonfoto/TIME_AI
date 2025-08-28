import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    define: {
      'process.env': {}
    },
    plugins: [react({
      // This enables fast refresh in development
      fastRefresh: true
    })],
    envPrefix: 'VITE_', // Only load env variables that start with VITE_
    server: {
    port: process.env.PORT || 3001,
    host: true,
    hmr: {
      host: 'localhost',
      port: process.env.PORT || 3001,
      protocol: 'ws',
      overlay: true
    },
    watch: {
      usePolling: true,
      interval: 100
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
    },
    preview: {
      port: 3003,
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
    }
  }
})