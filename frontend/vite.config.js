import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Em dev, encaminha /api para o Spring Boot local. Sem isso, o
    // fetch("/api/...") bate no próprio Vite (404) e os painéis caem
    // silenciosamente no fallback de dados de exemplo.
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
})
