// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * The shared vocabulary between a Wirefront screen and the builder's backend
 * (see SCREEN-CONTRACT.md). Screens take data and actions as props typed with
 * these, so wiring a screen is the same shape whatever the backend is.
 */

/** Where a screen's data is. Screens render a skeleton, the data or an error. */
export type AsyncStatus = "loading" | "ready" | "error";

export type SortDirection = "asc" | "desc";

export interface ListSort {
  id: string;
  direction: SortDirection;
}

/**
 * A server-driven list query. Screens with lists receive it as a prop and
 * report changes through `onQueryChange`; the builder sends it to their API.
 * `page` starts at 1.
 */
export interface ListQuery<Filters extends Record<string, unknown> = Record<string, unknown>> {
  page: number;
  pageSize: number;
  sort?: ListSort;
  search?: string;
  filters?: Partial<Filters>;
}

/** Field name → message(s), as Base UI's `<Form errors>` expects. */
export type FieldErrors = Record<string, string | string[]>;

/** What an action resolves with. Resolving with nothing means success. */
export type ActionResult<Output = void> =
  | { ok: true; data: Output }
  | { ok: false; error?: string; fieldErrors?: FieldErrors };

/**
 * A call the screen makes to the builder's backend, e.g. `onInvite`. It may
 * resolve with an ActionResult, resolve with nothing (success) or throw
 * (failure, using the error's message).
 */
// biome-ignore lint/suspicious/noConfusingVoidType: `void` is what lets builders pass a plain `async (x) => { await api(x) }` (Promise<void>) as well as actions that return a result on some paths; void-free unions break both (see tests/wirefront-contract.test.tsx). Approved exception, D-014.
export type Action<Input = void, Output = void> = (input: Input) => Promise<ActionResult<Output> | void>;

export const ok = <Output>(data: Output): ActionResult<Output> => ({ ok: true, data });

export const fail = (error?: string, fieldErrors?: FieldErrors): ActionResult<never> => ({
  ok: false,
  error,
  fieldErrors,
});

/** Run an action and normalise whatever it returns or throws into an ActionResult. */
export async function settle<Input, Output>(action: Action<Input, Output>, input: Input): Promise<ActionResult<Output>> {
  try {
    const result = await action(input);
    return result ?? ({ ok: true, data: undefined } as ActionResult<Output>);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
