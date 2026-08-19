import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      // Diarahkan ke sumber TypeScript agar perubahan di packages/shared langsung
      // terasa saat dev tanpa perlu build ulang paketnya.
      '@radgate/shared': path.resolve(import.meta.dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: process.env.VITE_API_URL ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Dipisah karena masing-masing berat dan jarang dipakai bersamaan.
        // Lihat docs/05-roadmap.md soal kenapa bundel tunggal dihindari.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](recharts|d3-|victory-)/.test(id)) return 'vendor-charts'
          if (/[\\/]node_modules[\\/](leaflet|react-leaflet|@react-leaflet)/.test(id)) return 'vendor-map'
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)) {
            return 'vendor-react'
          }
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})
