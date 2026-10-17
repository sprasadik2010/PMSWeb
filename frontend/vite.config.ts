import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Detect if running inside Tauri
  const isTauri = process.env.TAURI === 'true'
  const backendUrl = isTauri ? 'http://127.0.0.1:8000' : env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'

  console.log(`🚀 Using backend URL: ${backendUrl}`)

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: backendUrl, changeOrigin: true, secure: false },
        '/auth': { target: backendUrl, changeOrigin: true, secure: false },
        '/doctors': { target: backendUrl, changeOrigin: true, secure: false },
        '/patients': { target: backendUrl, changeOrigin: true, secure: false },
        '/bills': { target: backendUrl, changeOrigin: true, secure: false },
        '/dashboard': { target: backendUrl, changeOrigin: true, secure: false },
        '/reports': { target: backendUrl, changeOrigin: true, secure: false },
        '/settings': { target: backendUrl, changeOrigin: true, secure: false },
        '/ads': { target: backendUrl, changeOrigin: true, secure: false },
        '/admin': { target: backendUrl, changeOrigin: true, secure: false },
        '/prescriptions': { target: backendUrl, changeOrigin: true, secure: false },
        '/medicines': { target: backendUrl, changeOrigin: true, secure: false },
        '/appointments': { target: backendUrl, changeOrigin: true, secure: false },
        '/clinic-settings': { target: backendUrl, changeOrigin: true, secure: false },
        '/discharge-summaries': { target: backendUrl, changeOrigin: true, secure: false },
        '/staff': { target: backendUrl, changeOrigin: true, secure: false }
      }
    },
    define: {
      'process.env.VITE_BACKEND_URL': JSON.stringify(backendUrl)
    }
  }
})
