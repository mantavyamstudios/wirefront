# Screen Contract

Every screen that is **ready to wire** follows this contract: a builder installs it and connects it to their backend without editing its UI code.

> **Status: locked (v1).** Reviewed against the three [Phase 4 pilot](https://github.com/mantavyamstudios/wirefront/wiki/Roadmap#phase-4-pilot-3-screens) screens: `auth/sign-in` (forms), `tables/members` (server-driven lists and mutations) and `dashboards/metrics-overview` (read-only data). Changes go through a pull request to this file with an entry in the [decision log](https://github.com/mantavyamstudios/wirefront/wiki/Decisions); the [wiki](https://github.com/mantavyamstudios/wirefront/wiki/Screen-Contract) mirrors it. [WIRING.md](WIRING.md) shows the pilots wired to real backends.

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

  // actions: one input, Promise-returning; the view handles pending, success, failure.
  // Optional: a control whose action isn't given is not shown.
  onInvite?: Action<InviteInput, Member>
  onRoleChange?: Action<{ id: string; role: AssignableRole }>
  onRemove?: Action<string>
}
```

Rules:

1. **Data in, events out.** No module-level data in `view.tsx`. Every list, user, number and label that would come from a backend arrives through props.
2. **Actions return Promises.** The view shows pending state, applies optimistic updates when it is safe, rolls back on rejection and shows the error. No `setTimeout` fake latency.
3. **Every state is built in:** loading (skeleton), empty, error with retry. Each is reachable through props and declared in `designs.ts` `states`. Permissions hide individual controls through the provider's `can`; a `forbidden` state is only for screens that can be denied as a whole.
4. **Lists are controlled.** Pagination, sort, filters and search are a `ListQuery` the builder sends to their API.
5. **Forms use Base UI `Form` and `Field`.** Values are validated with the screen's zod schema in `onFormSubmit`; field errors the API returns (field → message) are passed to `<Form errors>`, which clears each one as the user edits that field.
6. **No framework imports.** Links, toasts, formatting, strings and permissions come from `WirefrontProvider`.
7. **Deterministic render.** No `Math.random()` during render (the browser check fails on the hydration mismatch it causes). Screens read the clock only through the provider (`useWirefront().now`, `useFormat`), never `Date.now()` or `new Date()`, so tests, previews and server renders can pin it (a catalogue test enforces this). Ids for items created in the browser come from a counter, not the clock.
8. **Client boundary.** Interactive views start with `"use client"`.
9. **Licence header.** Every file starts with the SPDX header.
10. **Unwired means hidden.** An optional action or link prop that isn't given hides its control. No control does nothing when clicked.
11. **Raw values in, formatted out.** APIs return numbers, ISO dates and units; the screen formats them with `useFormat`, so the builder's locale, time zone and currency apply. No preformatted strings in the data.
12. **Safe mutations.** Destructive actions ask for confirmation first. Reversible updates (a role, a toggle) apply at once and roll back with the error shown if the action fails.
13. **Server-safe schemas.** `schema.ts`, `types` and `api` carry no `"use client"`, so the builder validates requests on the server with the same zod schemas.
14. **Lists report every change.** Search, filter and sort changes go back to page 1 and fire `onQueryChange` each time; debouncing is the builder's choice (it belongs with their fetching).

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
  onRoleChange={({ id, role }) => api.members.update(id, { role })}
  onRemove={(id) => api.members.remove(id)}
/>
```

## Definition of done

A screen gets the **Ready to wire** badge when all of these hold:

- [ ] `schema.ts`, `view.tsx`, `fixtures.ts`, `demo.tsx` exist and typecheck, including under the strictest template settings (`tsconfig.shipped.json`)
- [ ] Fixtures satisfy the schemas
- [ ] `view.tsx` passes the contract checker (no hard-coded data, `setTimeout`, router or framework imports)
- [ ] All states reachable from the interaction panel's state switcher
- [ ] Every action is a Promise callback with pending, success and error handling
- [ ] Wiring tests (`apps/www/tests/<screen>.test.tsx`) cover what each action receives and what the screen shows for success, returned failures and thrown errors
- [ ] Semantic tokens only; logical properties; strings through messages
- [ ] axe clean in every declared state (zero violations, nothing baselined); icon buttons labelled; tap targets ≥ 24px; keyboard path works; reduced motion respected
- [ ] Responsive audit passes at 375 / 768 / 1024 / 1440px
- [ ] Installs and builds in fresh Next.js, TanStack Start and Vite apps
- [ ] Props table and at least one typechecked wiring recipe (in [WIRING.md](WIRING.md) until each screen has its docs page)
