import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/graphql': {
        target:      'http://localhost:4000',
        changeOrigin: true,
      },
      '/events': {
        target:      'http://localhost:4000',
        changeOrigin: true,
      },
      '/api': {
        target:      'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})

