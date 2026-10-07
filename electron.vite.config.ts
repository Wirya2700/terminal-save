import { resolve } from 'path'
import { defineConfig } from 'electron-vite'

const sharedAlias = {
  '@shared': resolve(__dirname, 'src/shared'),
}

export default defineConfig({
  main: {
    root: 'src/main',
    outDir: 'out/main',
    resolve: {
      alias: sharedAlias,
    },
    build: {
      rollupOptions: {
        external: ['electron'],
      },
    },
  },
  preload: {
    root: 'src/preload',
    outDir: 'out/preload',
    build: {
      rollupOptions: {
        external: ['electron'],
      },
    },
  },
  renderer: {
    root: 'src/renderer',
    outDir: 'out/renderer',
    resolve: {
      alias: sharedAlias,
    },
    build: {
      target: 'esnext',
    },
  },
})
