# `apps/www`

The Enterprise UI Playground website: Next.js 16 (App Router) with Fumadocs, Tailwind CSS v4 and Motion.

| Route                         | What it is                                 |
| ----------------------------- | ------------------------------------------ |
| `/`                           | Landing page                               |
| `/flows`                      | Gallery of every flow, grouped by category |
| `/flows/<category>/<flow>`    | Live Flutter preview, docs and Dart source |
| `/docs`                       | Guides (`content/docs`)                    |
| `/pricing`, `/legal/*`        | Pricing, privacy policy and terms          |
| `/llms.txt`, `/llms-full.txt` | Markdown index and export for AI tools     |

The Flutter preview is served from `public/runtime`, built in `apps/runtime` (`bun run build:embed && bun run sync:embed`).

```bash
bun run dev            # http://localhost:3000
bun run build          # static export → out/
bun run preview        # serve out/ like Cloudflare Pages
bun run flows:manifest # regenerate lib/flows/flows.manifest.json and content/flows
bun run check-types
```

See the [root README](../../README.md) for the full setup.
