# Wiring recipes

A ready-to-wire screen takes your backend as props: data in, actions out (see [SCREEN-CONTRACT.md](SCREEN-CONTRACT.md)). Each pilot screen below is wired in one or more of three ways:

- **Plain `fetch`**: any React app, any backend.
- **TanStack Query**: caching, retries and invalidation on the client.
- **Next.js server action**: no API route; the action runs on your server.

Every action has one shape:

```ts
type Action<Input, Output> = (input: Input) => Promise<ActionResult<Output> | void>;
```

Resolve with nothing or `ok(data)` on success. Resolve with `fail(message, fieldErrors)` to show what went wrong, or throw: the screen shows the error's message either way. `ok`, `fail` and the schemas in `schema.ts` are server-safe, so the same validation runs on both sides.

After `npx shadcn add`, a screen lives in `components/wirefront/<screen>/`. The snippets below import from there.

## App-wide setup

Wrap your app once in `WirefrontProvider` (links, locale, time zone, currency, copy, permissions and `onError`). Two settings belong next to it:

- **Errors.** Every screen renders inside a `ScreenBoundary`: if it throws while rendering it shows a retry fallback instead of taking your page down. Pass `onError` to report it:

  ```tsx
  <WirefrontProvider
    onError={(error, { screen, componentStack }) =>
      Sentry.captureException(error, { tags: { screen }, extra: { componentStack } })
    }
  >
    {children}
  </WirefrontProvider>
  ```

- **Right-to-left languages.** Screens use logical properties (`ms-`, `pe-`, `start-`, `text-start`), so they mirror when the page is RTL. Set `dir` on `<html>` and give Base UI the same direction, so menus, sliders and keyboard navigation follow it:

  ```tsx
  import { DirectionProvider } from "@base-ui/react/direction-provider";

  <html dir={dir}>
    <body>
      <DirectionProvider direction={dir}>
        <WirefrontProvider locale={locale}>{children}</WirefrontProvider>
      </DirectionProvider>
    </body>
  </html>
  ```

## auth/sign-in

The screen calls these props (all optional except `product` and `onSignIn`; options you don't wire are not shown):

| Prop | Type | Operation in `schema.ts` |
| --- | --- | --- |
| `onSignIn` | `Action<SignInInput, Session>` | `POST /auth/sign-in` |
| `onPasskey` | `Action<void, Session>` | `POST /auth/passkey` |
| `onMagicLink` | `Action<MagicLinkInput>` | `POST /auth/magic-link` |
| `providers` + `onProvider` | `{ id, name, icon? }[]` + `Action<string>` | your OAuth start URL |
| `onSuccess` | `(session) => void` | navigate after sign-in |
| `error` | `string` | an error that came with the page (expired session, failed callback) |
| `forgotPasswordHref`, `signUpHref`, `ssoHref` | `string` | links, rendered through your router (`WirefrontProvider link`) |

### Plain fetch

```tsx
"use client";
import { SignIn } from "@/components/wirefront/auth-sign-in/view";
import { fail, ok } from "@/components/wirefront/types";
import type { Session, SignInInput } from "@/components/wirefront/auth-sign-in/schema";

async function signIn(input: SignInInput) {
  const res = await fetch("/api/auth/sign-in", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 401) return fail(undefined, { password: "That password doesn’t match this account." });
  if (!res.ok) return fail("Couldn’t sign you in. Try again in a moment.");
  return ok((await res.json()) as Session);
}

export function SignInPage() {
  return (
    <SignIn
      product="Acme"
      onSignIn={signIn}
      onSuccess={(session) => window.location.assign(session?.redirectTo ?? "/")}
      forgotPasswordHref="/forgot-password"
      signUpHref="/sign-up"
    />
  );
}
```

### TanStack Query

```tsx
"use client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { SignIn } from "@/components/wirefront/auth-sign-in/view";
import { signIn } from "./api"; // the fetch function above

export function SignInPage() {
  const router = useRouter();
  const mutation = useMutation({ mutationFn: signIn });
  return (
    <SignIn
      product="Acme"
      onSignIn={mutation.mutateAsync}
      onSuccess={(session) => router.navigate({ to: session?.redirectTo ?? "/" })}
    />
  );
}
```

The screen tracks its own pending and error state from the promise, so you don't pass `mutation.isPending` in.

### Next.js server action

```tsx
// app/sign-in/actions.ts
"use server";
import { fail, ok } from "@/components/wirefront/types";
import { SignInInput } from "@/components/wirefront/auth-sign-in/schema";
import { auth } from "@/lib/auth"; // your auth library

export async function signIn(input: SignInInput) {
  const parsed = SignInInput.safeParse(input); // never trust the client
  if (!parsed.success) return fail("Check the highlighted fields.");
  const session = await auth.signIn(parsed.data);
  if (!session) return fail(undefined, { password: "That password doesn’t match this account." });
  return ok({ userId: session.userId, redirectTo: "/dashboard" });
}
```

```tsx
// app/sign-in/page.tsx (a server component)
import { signIn } from "./actions";
import { SignInClient } from "./sign-in-client";

export default function Page() {
  return <SignInClient onSignIn={signIn} />;
}
```

```tsx
// app/sign-in/sign-in-client.tsx
"use client";
import { useRouter } from "next/navigation";
import { SignIn, type SignInProps } from "@/components/wirefront/auth-sign-in/view";

export function SignInClient({ onSignIn }: Pick<SignInProps, "onSignIn">) {
  const router = useRouter();
  return <SignIn product="Acme" onSignIn={onSignIn} onSuccess={(s) => router.push(s?.redirectTo ?? "/")} />;
}
```

A server action can be passed straight to a client component as a prop. The small client wrapper exists only because `onSuccess` needs the client router.

### The API contract

`schema.ts` exports `api`: every operation the screen needs, with its method, path, request and response schemas and error codes. Use it as the spec for your endpoints, and `fixtures.ts` as sample responses. Wirefront generates an OpenAPI 3.1 document and [MSW](https://mswjs.io) handlers from it (`scripts/lib/openapi.ts`, in this repo); each screen's docs page will publish its OpenAPI excerpt ([#82](https://github.com/mantavyamstudios/wirefront/issues/82)).

## tables/members

A server-driven list: the table renders the page you pass and reports what the user wants next as a `ListQuery`. You fetch that page and pass it back.

| Prop | Type | Operation in `schema.ts` |
| --- | --- | --- |
| `members`, `total` | `Member[]`, `number` | `GET /members` → `MembersPage` |
| `query`, `onQueryChange` | `ListQuery<{ role }>` | the request's query string (`MembersQuery`) |
| `status`, `error`, `onRetry` | `"loading" \| "ready" \| "error"` | |
| `onInvite` | `Action<InviteInput, Member>` | `POST /members/invitations` |
| `onRoleChange` | `Action<{ id, role }>` | `PATCH /members/{id}` |
| `onRemove` | `Action<string>` | `DELETE /members/{id}` |
| `onTransferOwnership` | `Action<string>` | `POST /members/{id}/transfer-ownership` |

Management controls also respect `WirefrontProvider can`: the table asks `can("manage", "members")`.

`ListQuery` is nested (`sort: { id, direction }`, `filters: { role }`); the API takes flat query parameters. One function maps between them:

```ts
import type { MembersListQuery } from "@/components/wirefront/table-members/view";

export function toSearchParams(q: MembersListQuery) {
  const params = new URLSearchParams({ page: String(q.page), pageSize: String(q.pageSize) });
  if (q.search) params.set("search", q.search);
  if (q.sort) {
    params.set("sort", q.sort.id);
    params.set("direction", q.sort.direction);
  }
  if (q.filters?.role) params.set("role", q.filters.role);
  return params;
}
```

### TanStack Query

```tsx
"use client";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MembersTable, type MembersListQuery } from "@/components/wirefront/table-members/view";
import type { AssignableRole, InviteInput, MembersPage } from "@/components/wirefront/table-members/schema";
import { toSearchParams } from "./members-query";

/** Throws the API's message on failure; the table shows it. Resolves with nothing on success. */
async function send(method: string, url: string, body?: unknown): Promise<void> {
  const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Request failed.");
}

export function MembersScreen() {
  const [query, setQuery] = useState<MembersListQuery>({ page: 1, pageSize: 20 });
  const client = useQueryClient();
  const list = useQuery({
    queryKey: ["members", query],
    queryFn: async () => {
      const res = await fetch(`/api/members?${toSearchParams(query)}`);
      if (!res.ok) throw new Error("The members didn’t load.");
      return (await res.json()) as MembersPage;
    },
    placeholderData: keepPreviousData, // keep the current page on screen while the next loads
  });
  const refresh = () => client.invalidateQueries({ queryKey: ["members"] });

  const invite = useMutation({
    mutationFn: (input: InviteInput) => send("POST", "/api/members/invitations", input),
    onSuccess: refresh,
  });
  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AssignableRole }) => send("PATCH", `/api/members/${id}`, { role }),
    onSettled: refresh,
  });
  const remove = useMutation({ mutationFn: (id: string) => send("DELETE", `/api/members/${id}`), onSuccess: refresh });

  return (
    <MembersTable
      members={list.data?.items ?? []}
      total={list.data?.total ?? 0}
      query={query}
      onQueryChange={setQuery}
      status={list.isPending ? "loading" : list.isError ? "error" : "ready"}
      error={list.error?.message}
      onRetry={() => list.refetch()}
      onInvite={invite.mutateAsync}
      onRoleChange={changeRole.mutateAsync}
      onRemove={remove.mutateAsync}
    />
  );
}
```

The table applies a role change at once and rolls it back if the promise rejects, so you don't need TanStack Query's optimistic updates as well. `onQueryChange` fires on every keystroke in the search box; to send fewer requests, debounce the query you put in `queryKey`.

### Next.js (server component + server actions)

```tsx
// app/members/page.tsx
import { MembersClient } from "./members-client";
import { listMembers } from "@/lib/members"; // your data access

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const query = { page: Number(params.page ?? 1), pageSize: 20, search: params.search };
  const page = await listMembers(query);
  return <MembersClient page={page} query={query} />;
}
```

```tsx
// app/members/members-client.tsx
"use client";
import { usePathname, useRouter } from "next/navigation";
import { MembersTable, type MembersListQuery } from "@/components/wirefront/table-members/view";
import type { MembersPage } from "@/components/wirefront/table-members/schema";
import { toSearchParams } from "./members-query";
import { inviteMember, removeMember, updateMemberRole } from "./actions"; // "use server" actions returning ok/fail

export function MembersClient({ page, query }: { page: MembersPage; query: MembersListQuery }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <MembersTable
      members={page.items}
      total={page.total}
      query={query}
      onQueryChange={(next) => router.replace(`${pathname}?${toSearchParams(next)}`)}
      onInvite={inviteMember}
      onRoleChange={updateMemberRole}
      onRemove={removeMember}
    />
  );
}
```

Each server action calls `revalidatePath("/members")` on success, so the table receives the fresh page.

## dashboards/metrics-overview

Read-only: one request per range. The API returns raw numbers (`value`, `unit`, `change` as a fraction); the screen formats them with the provider's `locale` and `currency`.

| Prop | Type | Operation in `schema.ts` |
| --- | --- | --- |
| `data` | `Overview` (leave out while loading) | `GET /overview?range=` |
| `range`, `onRangeChange` | `"7d" \| "30d" \| "90d"` | the `range` parameter |
| `status`, `error`, `onRetry` | | |
| `onNewReport`, `activityHref` | optional | |

### Plain fetch

```tsx
"use client";
import { useEffect, useState } from "react";
import { MetricsOverview } from "@/components/wirefront/dashboards-metrics-overview/view";
import type { Overview, Range } from "@/components/wirefront/dashboards-metrics-overview/schema";

export function OverviewPage() {
  const [range, setRange] = useState<Range>("30d");
  const [data, setData] = useState<Overview>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setData(undefined);
    setError(undefined);
    fetch(`/api/overview?range=${range}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("The overview didn’t load."))))
      .then((overview: Overview) => current && setData(overview))
      .catch((err: Error) => current && setError(err.message));
    return () => {
      current = false;
    };
  }, [range, attempt]);

  return (
    <MetricsOverview
      data={data}
      range={range}
      onRangeChange={setRange}
      status={error ? "error" : data ? "ready" : "loading"}
      error={error}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}
```

With TanStack Query it is `useQuery({ queryKey: ["overview", range], queryFn })` and the same props, as in the members recipe.
