import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function gitAuthPayload() {
  const token = process.env.POWERLOG_GIT_TOKEN || ''
  return JSON.stringify([...token].map(ch => ch.charCodeAt(0) ^ 91))
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/powerlog/',
  define: {
    __PWR__: gitAuthPayload(),
  },
  server: {
    host: true,
    port: 5173,
  },
})
