# Wiring recipes

A ready-to-wire screen takes your backend as props: data in, actions out (see [SCREEN-CONTRACT.md](SCREEN-CONTRACT.md)). This page shows the same screen wired three ways:

- **Plain `fetch`**: any React app, any backend.
- **TanStack Query**: caching, retries and invalidation on the client.
- **Next.js server action**: no API route; the action runs on your server.

Every action has one shape:

```ts
type Action<Input, Output> = (input: Input) => Promise<ActionResult<Output> | void>;
```

Resolve with nothing or `ok(data)` on success. Resolve with `fail(message, fieldErrors)` to show what went wrong, or throw: the screen shows the error's message either way. `ok`, `fail` and the schemas in `schema.ts` are server-safe, so the same validation runs on both sides.

After `npx shadcn add`, a screen lives in `components/wirefront/<screen>/`. The snippets below import from there.

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
