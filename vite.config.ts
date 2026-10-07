import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Exposes server on localhost and local network IP (0.0.0.0)
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('react') || id.includes('react-dom')) return 'vendor';
          }
        },
      },
    },
  },
})
