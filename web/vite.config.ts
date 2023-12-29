import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import shopify from 'vite-plugin-shopify'

export default defineConfig({
  plugins: [
    shopify({
      themeRoot: '../extensions/rent-btn'
    }),
    react(),
  ]
})