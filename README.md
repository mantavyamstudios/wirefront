# Wirefront

200 responsive UI screens built on [shadcn/ui](https://ui.shadcn.com) with [Base UI](https://base-ui.com) and Tailwind v4, each installable with the shadcn CLI. Browse a screen, preview it on desktop, tablet or phone, then copy its source or install it.

By [Mantavyam Studios](https://mantavyam.in) · [GitHub](https://github.com/mantavyamstudios) · [Book a call](https://cal.com/mantavyam/business)

## Layout

```
.
├── apps/
│   ├── www         →  the site (Next.js static export, Fumadocs; port 3000)
│   └── runtime     →  the screen previews (Vite + TanStack Start; port 4000)
└── packages/
    ├── ui          →  shadcn/ui (base-nova) components + Wirefront's own Base UI components
    ├── bridge      →  the messages between the site and the preview iframe
    ├── shell-ui    →  the site's own components (@workspace/ui)
    └── typescript-config
```

The site is the Sora UI shell from the Enterprise UI Playground. Each screen page keeps one runtime iframe mounted and switches screens, theme and replays by message (`@wirefront/bridge`), so moving between screens never reloads it. No backend, no auth, no database.

## Scripts

```bash
bun run dev               # site on :3000, runtime on :4000
bun run typecheck         # tsc across workspaces (builds the registry first)
bun run build             # registry, runtime, site; the runtime's pages are copied into apps/www/out
bun run registry          # rebuild the shadcn registry files (apps/www/public/r)
bun run test              # unit and contract tests
bun run test:bridge       # site <-> runtime messages in a browser
bun run test:site         # the built site, served by wrangler, in a browser
bun run test:browser      # every screen: runtime errors, hydration, accessibility
bun run snapshot          # capture gallery previews (needs `bun run dev:runtime`)
bun run audit:responsive  # responsive checks at 375/768/1024/1440px
```

`SNAPSHOT_ONLY_MISSING=1 bun run snapshot` captures previews only for designs that don't have one yet.

`apps/www/out` is the whole deployment (`wrangler.jsonc` serves it as Workers static assets).

## Addresses

A screen lives at `/{group}/{kind}/{screen}`, for example `/accounts/pricing/three-tier`. `/accounts/pricing` lists a kind's screens, `/accounts` a group's and `/screens` all of them. `/pricing` is the site's own pricing page, `/docs` the documentation, and `/r/<kind>-<screen>.json` the shadcn registry item. The runtime serves `/preview/<kind>/<screen>` (the iframe) and `/demo`.

The six groups are Shells (layouts), Accounts (auth, settings, profile, pricing), Data (dashboards, tables, charts, filters), Activity (cards, timelines, calendars, threads), Interaction (forms, modals, toasts, tours, empty states) and Products (apps, AI, dev tools, personal, commerce).

## Screen pages

Every screen page shows the screen live on a phone, tablet or laptop frame (rotate, replay, light/dark, expand with `⌘J`), its docs beside it, and a Code tab with the files it installs.

## How designs are organised

- `apps/runtime/src/lib/designs.ts` — categories (the URL's kinds) and the designs in each (slug, title, blurb).
- `apps/runtime/src/pages/showcase/source-files.ts` — maps `(category, design-slug)` → showcase file; the registry build reads it.
- `apps/runtime/src/pages/showcase/` — ready-to-wire screens are folders (see `SCREEN-CONTRACT.md`); older ones are one file per design, exporting a component named after the file.
- `apps/www/lib/screens/groups.ts` — which kinds sit in which group.
- `apps/www/scripts/screens-manifest.mts` — turns the catalogue into the site's manifest, sidebar and one MDX page per screen (`apps/www/content/screens/<group>/<kind>/<screen>.mdx`, written once and then yours to edit). It runs before `dev` and `build`; `bun run --cwd apps/www screens:check` fails on drift.

### Adding a new design

1. Add the screen as a folder `apps/runtime/src/pages/showcase/<category>-<my-design>/` with `view.tsx`, `schema.ts`, `fixtures.ts` and a `demo.tsx` exporting `<Name>ShowcasePage` (see `SCREEN-CONTRACT.md`).
2. Map it in `source-files.ts` under the right category.
3. Add a `{ slug, title, blurb }` entry to that category in `designs.ts`.
4. Run `SNAPSHOT_ONLY_MISSING=1 bun run snapshot` with the runtime dev server running to add its preview.
5. Run `bun run dev` (or `bun run --cwd apps/www screens:manifest`) to add its page, then write its docs in the new MDX file.

### Adding a new category

1. Add the wireframe SVG to `wireframe-icons.tsx`.
2. Add the category to `CATEGORIES` in `designs.ts` (and to the `CategorySlug` union).
3. Add it to one group in `apps/www/lib/screens/groups.ts`.

## Roadmap and contributing

Wirefront is being upgraded so every screen is ready to wire to any backend. Progress is tracked on the [wiki roadmap](https://github.com/mantavyamstudios/wirefront/wiki/Roadmap). Contributions are welcome; pull requests need a signed [Contributor License Agreement](CLA.md), and the CLA check explains how on your first pull request.

## Credits

The site is the [Enterprise UI Playground](https://github.com/deveshmishra09/enterprise_ui_playground) shell (MIT), built on [Sora UI](https://github.com/SoraLabsOSS/ui) (MIT), parts of which come from [Animate UI](https://github.com/animate-ui/animate-ui) (MIT + Commons Clause). Wirefront started from [devl.dev](https://github.com/sean-brydon/devl.dev) by Sean Brydon. Its original screens were reworked here to be responsive and production-ready, and 42 screens from the current devl.dev are included (their files say so in a header comment). The components in `packages/ui` are [shadcn/ui](https://ui.shadcn.com) (MIT) plus Wirefront's own components on [Base UI](https://base-ui.com). See [NOTICE.md](NOTICE.md) for licenses.

## License

Copyright (c) 2026 Mantavyam Studios. Wirefront is licensed under the [MIT License](LICENSE).

Code that came from devl.dev keeps its MIT notice (Copyright (c) 2026 Sean Brydon), and the shadcn/ui components in `packages/ui` keep theirs (Copyright (c) 2023 shadcn). The site shell keeps the notices of the Enterprise UI Playground and Sora UI (MIT) and, for the parts derived from Animate UI, Animate UI's MIT + Commons Clause terms. All are listed in [NOTICE.md](NOTICE.md).
