import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, mergeConfig } from 'vite'
import { defineConfig as defineVitestConfig } from 'vitest/config'

const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    exclude: ['node_modules/**','e2e/**','server/**'],
    environment: 'jsdom',
  },
})

export default mergeConfig(
  defineConfig({
    plugins: [react(), tailwindcss()],
    server: { proxy: { "/api": "http://127.0.0.1:3001" } },
  }),
  vitestConfig,
)
