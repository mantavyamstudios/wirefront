// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { readFile } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, type Plugin } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// In dev, source-map requests for pre-bundled deps
// (/node_modules/.vite/deps/*.js.map) fall through to the TanStack Start SSR
// handler and come back as an HTML 404, so browser devtools log
// "Source map error". Serve them straight from Vite's deps cache instead.
function serveDepSourcemaps(): Plugin {
  return {
    name: 'wirefront:serve-dep-sourcemaps',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (!url.endsWith('.map') || !url.includes('/.vite/deps/')) return next()
        // basename() keeps the lookup inside the deps folder.
        const file = path.join(server.config.cacheDir, 'deps', path.basename(url))
        readFile(file, (err, data) => {
          if (err) return next()
          res.setHeader('Content-Type', 'application/json')
          res.end(data)
        })
      })
    },
  }
}

export default defineConfig({
  server: { port: 4000 },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  plugins: [serveDepSourcemaps(), tailwindcss(), tanstackStart(), nitro(), viteReact()],
})
