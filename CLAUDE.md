# CLAUDE.md

Wirefront by Mantavyam Studios — responsive UI screens built on `@orbit/ui` (coss-ui) primitives.

## Layout

- `apps/www` — TanStack Start app (port 4000). The whole product.
- `packages/ui` — coss-ui components (55), Tailwind v4 + Base UI. Imported as `@orbit/ui/<component>`.

That's it — no backend, no auth, no database, no marketing site.

## Commands

```bash
npm run dev          # Start Wirefront on :4000
npm run typecheck    # Type-check all workspaces
npm run build        # Build all workspaces
```

## How designs are organised

- `apps/www/src/lib/designs.ts` — single source of truth for categories and the designs inside each.
- `apps/www/src/components/wireframe-icons.tsx` — mini SVG wireframes used as folder icons on the index.
- `apps/www/src/pages/showcase/` — actual showcased designs (one component per design).
- `apps/www/src/pages/showcase/source-files.ts` — maps `(category, design-slug) → showcase file`; `registry.tsx` derives the component map from it.

### Adding a new design

1. Add the showcase component in `apps/www/src/pages/showcase/<my-design>.tsx`.
2. Map it in `apps/www/src/pages/showcase/source-files.ts` under the right category (export `<Name>ShowcasePage`).
3. Add a `{ slug, title, blurb }` entry to that category in `apps/www/src/lib/designs.ts`.

Design lives at `/c/<category>/<design-slug>`.

### Adding a new category

1. Add the wireframe SVG to `wireframe-icons.tsx`.
2. Add the category to `CATEGORIES` in `designs.ts` (and to the `CategorySlug` union).
