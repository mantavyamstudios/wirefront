# Screen Contract

Every screen that is **ready to wire** follows this contract: a builder installs it and connects it to their backend without editing its UI code.

> **Status: draft.** It is locked after the [Phase 4 pilot](https://github.com/mantavyamstudios/wirefront/wiki/Roadmap#phase-4-pilot-3-screens). Changes go through a pull request to this file; the [wiki](https://github.com/mantavyamstudios/wirefront/wiki/Screen-Contract) mirrors it.

## Folder layout

```
members-table/
  schema.ts     zod schemas and inferred types (builders reuse them on the server)
  view.tsx      the screen: props in, UI out; no data, no fetching, no router
  fixtures.ts   demo data that satisfies schema.ts
  demo.tsx      view + fixtures + simulated handlers; what the showcase renders
```

Only `schema.ts` and `view.tsx` are required in a builder's app. `fixtures.ts` and `demo.tsx` ship too, for tests, Storybook and MSW mocks.

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
