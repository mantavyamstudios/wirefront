# Screen Contract

Every screen that is **ready to wire** follows this contract: a builder installs it and connects it to their backend without editing its UI code.

> **Status: draft.** It is locked after the [Phase 4 pilot](https://github.com/mantavyamstudios/wirefront/wiki/Roadmap#phase-4-pilot-3-screens). Changes go through a pull request to this file; the [wiki](https://github.com/mantavyamstudios/wirefront/wiki/Screen-Contract) mirrors it.

## Folder layout

A ready-to-wire screen is a folder in `apps/www/src/pages/showcase/`:

```
tables-members/
  schema.ts     zod schemas, inferred types and the API contract: export const api = defineApi({…})
  view.tsx      the screen: props in, UI out; no data, no fetching, no router
  fixtures.ts   demo data that satisfies schema.ts (also what the generated mocks return)
  demo.tsx      view + fixtures + the previewed state; exports <Name>ShowcasePage
```

`schema.ts` and `view.tsx` are what a builder wires; `fixtures.ts` ships too, for tests and mocks. `demo.tsx` is showcase-only (simulated actions, previewed state) and is never shipped. The registry installs the screen as `components/wirefront/<screen>/{view.tsx,schema.ts,fixtures.ts}` with the helpers it uses beside it. The contract checker (`scripts/lib/contract.ts`) enforces this layout and the rules below on every push.

## Building blocks

Screens build on the contract helpers in `packages/ui/src/wirefront/` (imported as `@wirefront/ui/wirefront/<name>`; installed into a builder's project under `components/wirefront/`):

| Helper | What it gives a screen |
|---|---|
| `types` | `AsyncStatus`, `ListQuery`, `FieldErrors`, `ActionResult`, `Action`, `ok`, `fail`, `settle`. Server-safe (no `"use client"`): use `ok`/`fail` in server actions too. |
| `provider` | `WirefrontProvider`, `useWirefront`, `useFormat` (dates, times, money, relative), `useMessages` (copy overrides), `useCan`, `WirefrontLink`, `useColorScheme` |
| `form` | `useActionForm({ schema, action })`: Base UI `<Form>` + zod + the builder's action, field errors from either side, pending |
| `action` | `useAction(action, { optimistic })`: pending per item, optimistic update with rollback |
| `list` | `toggleSort`, `withSearch`, `withFilter`, `withPage`, `withPageSize`, `useListQuery`, `useSelection` |
| `api` | `defineApi({…})`: the screen's backend operations; Wirefront generates OpenAPI 3.1 and MSW mocks from it. Server-safe, so `schema.ts` can validate requests on the server. |

## States

A screen lists the states it renders in `designs.ts` (`states: ["ready", "loading", "empty", "error", "forbidden"]`, ready first). The interaction panel switches between them (key `S`, URL `?state=`), and `demo.tsx` reads the current one with `useShowcaseState()` to pass the matching props.

## Props

```tsx
type MembersTableProps = {
  // data: always from props, never hard-coded
  members: Member[]
  total: number

  // state: the screen renders every state itself
  status?: AsyncStatus            // "ready" | "loading" | "error"
  error?: string
  onRetry?: () => void

  // server-driven list query (controlled)
  query: ListQuery                // { page, pageSize, sort, filters, search }
  onQueryChange: (query: ListQuery) => void

  // actions: Promise-returning; the view handles pending, success, failure
  onInvite: (input: InviteInput) => Promise<ActionResult>
  onRoleChange: (id: string, role: Role) => Promise<ActionResult>
  onRemove: (id: string) => Promise<ActionResult>
}
```

Rules:

1. **Data in, events out.** No module-level data in `view.tsx`. Every list, user, number and label that would come from a backend arrives through props.
2. **Actions return Promises.** The view shows pending state, applies optimistic updates when it is safe, rolls back on rejection and shows the error. No `setTimeout` fake latency.
3. **Every state is built in:** loading (skeleton), empty, error with retry, forbidden, partial data. Each is reachable through props.
4. **Lists are controlled.** Pagination, sort, filters and search are a `ListQuery` the builder sends to their API.
5. **Forms use Base UI `Form` and `Field`.** Values are validated with the screen's zod schema in `onFormSubmit`; field errors the API returns (field → message) are passed to `<Form errors>`, which clears each one as the user edits that field.
6. **No framework imports.** Links, toasts, formatting, strings and permissions come from `WirefrontProvider`.
7. **Deterministic render.** No `Math.random()`, `Date.now()` or `new Date()` during render; time arrives as props or through the provider.
8. **Client boundary.** Interactive views start with `"use client"`.
9. **Licence header.** Every file starts with the SPDX header.

## WirefrontProvider

One provider at the root of the builder's app adapts Wirefront to their stack:

```tsx
<WirefrontProvider
  link={NextLink}                  // or TanStack / React Router Link
  toast={toast}                    // their toast function
  locale="en-IN" timeZone="Asia/Kolkata" currency="INR"
  messages={messages}              // optional overrides for every string
  can={(action, resource) => ability.can(action, resource)}
>
```

## Wiring, from the builder's side

```tsx
const { data, status, refetch } = useQuery(membersQuery(query))

<MembersTable
  members={data?.items ?? []} total={data?.total ?? 0}
  status={status === "pending" ? "loading" : status === "error" ? "error" : "ready"}
  onRetry={refetch}
  query={query} onQueryChange={setQuery}
  onInvite={(input) => api.members.invite(input)}
  onRoleChange={(id, role) => api.members.update(id, { role })}
  onRemove={(id) => api.members.remove(id)}
/>
```

## Definition of done

A screen gets the **Ready to wire** badge when all of these hold:

- [ ] `schema.ts`, `view.tsx`, `fixtures.ts`, `demo.tsx` exist and typecheck
- [ ] `view.tsx` passes the contract checker (no hard-coded data, `setTimeout`, router or framework imports)
- [ ] All states reachable from the interaction panel's state switcher
- [ ] Every action is a Promise callback with pending, success and error handling
- [ ] Semantic tokens only; logical properties; strings through messages
- [ ] axe clean; icon buttons labelled; tap targets ≥ 24px; keyboard path works; reduced motion respected
- [ ] Responsive audit passes at 375 / 768 / 1024 / 1440px
- [ ] Installs and builds in fresh Next.js, TanStack Start and Vite apps
- [ ] Docs page with props table and at least one wiring recipe
