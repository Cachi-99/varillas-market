import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  server: { proxy: { '/api': loadEnv(mode, '.', '').API_PROXY_TARGET || 'http://127.0.0.1:3000' } },
  plugins: [
    react(),
    tailwindcss(),
  ],
}))
