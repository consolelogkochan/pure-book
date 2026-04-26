import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 👈 これを追加

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(), // 👈 これを追加
  ],
  // Reactの二重読み込みを強制的に防ぐ（Dedupe）
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})
