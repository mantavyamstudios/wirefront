// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Writes .output/public/404.html after `vite build`, for static hosting.
// Prerendering skips pages that answer 404, so the site's not-found page is
// rendered here by the built server and saved where Cloudflare Workers serves
// it for unknown URLs (wrangler.jsonc: not_found_handling "404-page").
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, '.output/public/404.html')

const port = await new Promise((done, fail) => {
  const probe = createServer().listen(0, '127.0.0.1', () => {
    // A TCP listener always reports an AddressInfo (a string is only for pipes).
    const { port } = /** @type {import('node:net').AddressInfo} */ (probe.address())
    probe.close(() => done(port))
  })
  probe.on('error', fail)
})

const server = spawn(process.execPath, [resolve(root, '.output/server/index.mjs')], {
  env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
  stdio: ['ignore', 'inherit', 'inherit'],
})

try {
  const url = `http://127.0.0.1:${port}/this-page-does-not-exist`
  const deadline = Date.now() + 30_000
  let res
  for (;;) {
    try {
      res = await fetch(url)
      break
    } catch (error) {
      if (Date.now() > deadline) throw new Error(`the built server did not start on port ${port}: ${error}`)
      await new Promise((r) => setTimeout(r, 200))
    }
  }
  if (res.status !== 404) throw new Error(`expected the not-found page to answer 404, got ${res.status}`)
  const html = await res.text()
  if (!html.includes('</html>')) throw new Error('the not-found page did not render a full HTML document')
  await writeFile(out, html)
  console.log(`[404] wrote ${out} (${html.length} bytes)`)
} finally {
  server.kill()
}
