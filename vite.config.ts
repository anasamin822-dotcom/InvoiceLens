import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, mergeConfig } from 'vite'
import { defineConfig as defineVitestConfig } from 'vitest/config'

const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
})

export default mergeConfig(
  defineConfig({
    plugins: [react(), tailwindcss()],
  }),
  vitestConfig,
)
