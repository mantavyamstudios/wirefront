# Wirefront

200 responsive UI screens built on [coss ui](https://coss.com/ui) primitives (Base UI + Tailwind v4), each installable with the shadcn CLI. Browse a screen, preview it on desktop, tablet or phone, then copy its source or install it.

By [Mantavyam Studios](https://mantavyam.com) · [GitHub](https://github.com/mantavyamstudios) · [Book a call](https://cal.com/mantavyam/business)

## Layout

```
.
├── apps/
│   └── www         →  TanStack Start app — the whole product (port 4000)
└── packages/
    └── ui          →  coss ui components, Tailwind v4 + Base UI
```

No backend, no auth, no database. Just the showcase.

## Scripts

```bash
npm run dev               # start Wirefront on :4000
npm run typecheck         # tsc -b across workspaces
npm run build             # build all workspaces
npm run registry          # rebuild the shadcn registry files (public/r)
npm run snapshot          # capture homepage previews (needs the dev server)
npm run audit:responsive  # responsive checks at 375/768/1024/1440px
```

`SNAPSHOT_ONLY_MISSING=1 npm run snapshot` captures previews only for designs that don't have one yet.

Set `VITE_SITE_URL` (for example `https://wirefront.example`) when building for production so canonical and social-card URLs are absolute.

## Design page controls

Every design page has a floating panel: all designs (`Esc`), previous/next design (`←` `→`), previous/next category (`↑` `↓`), random (`R`), Preview/Code (`C`), light/dark (`T`), device preview (Galaxy Tab S7+ and Galaxy S23 Ultra at their real viewports, rotate with `O`), sound, palette and replay. `H` hides the panel.

## How designs are organised

- `apps/www/src/lib/designs.ts` — categories and the designs in each (slug, title, blurb).
- `apps/www/src/pages/showcase/source-files.ts` — maps `(category, design-slug)` → showcase file; `registry.tsx` and the registry build read it.
- `apps/www/src/pages/showcase/` — one file per design, exporting a `…ShowcasePage` component.
- `apps/www/src/components/wireframe-icons.tsx` — mini SVG wireframes used as category icons.

A design lives at `/c/<category>/<design-slug>`.

### Adding a new design

1. Add the showcase component in `apps/www/src/pages/showcase/<my-design>.tsx`, exporting `<Name>ShowcasePage`.
2. Map it in `source-files.ts` under the right category.
3. Add a `{ slug, title, blurb }` entry to that category in `designs.ts`.
4. Run `SNAPSHOT_ONLY_MISSING=1 npm run snapshot` with the dev server running to add its preview.

### Adding a new category

1. Add the wireframe SVG to `wireframe-icons.tsx`.
2. Add the category to `CATEGORIES` in `designs.ts` (and to the `CategorySlug` union).

## Credits

Wirefront started from [devl.dev](https://github.com/sean-brydon/devl.dev) by Sean Brydon. Its original screens were reworked here to be responsive and production-ready, and 42 screens from the current devl.dev are included (their files say so in a header comment). The components in `packages/ui` are [coss ui](https://coss.com/ui) by Cal.com, Inc. See [NOTICE.md](NOTICE.md) for licenses.

## License

Copyright (c) 2026 Mantavyam Studios. Wirefront is licensed under the [GNU Affero General Public License v3.0](LICENSE).

Code that came from devl.dev keeps its MIT notice (Copyright (c) 2026 Sean Brydon), and coss ui in `packages/ui` is AGPL-3.0 by Cal.com, Inc. Both are listed in [NOTICE.md](NOTICE.md).
