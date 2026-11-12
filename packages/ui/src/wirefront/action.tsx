// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

/**
 * The mutation pattern (SCREEN-CONTRACT.md, rule 2): a screen calls the
 * builder's Promise-returning action, shows it as pending (per item, for row
 * actions), applies an optimistic change when that's safe and rolls it back
 * if the action fails.
 *
 *   const remove = useAction(onRemove, {
 *     optimistic: (id) => setRows((rows) => rows.filter((r) => r.id !== id)),
 *     onError: (message) => toast({ title: message, variant: "error" }),
 *   });
 *   <Button disabled={remove.isPending(row.id)} onClick={() => remove.run(row.id, row.id)}>Remove</Button>
 */
import { useCallback, useRef, useState } from "react";

import { type Action, type ActionResult, settle } from "./types";

export interface ActionOptions<Input, Output> {
  /**
   * Apply the change before the action resolves. Return a function that undoes
   * it; it runs if the action fails.
   */
  // biome-ignore lint/suspicious/noConfusingVoidType: returning an undo function is optional, so a plain state update (which returns void) must also fit. Approved exception, D-014.
  optimistic?: (input: Input) => (() => void) | void;
  onSuccess?: (data: Output, input: Input) => void;
  onError?: (message: string, input: Input) => void;
}

export function useAction<Input = void, Output = void>(action: Action<Input, Output>, options: ActionOptions<Input, Output> = {}) {
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string>();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const run = useCallback(
    async (input: Input, key = "default"): Promise<ActionResult<Output>> => {
      setPending((p) => new Set(p).add(key));
      setError(undefined);
      const undo = optionsRef.current.optimistic?.(input);
      const result = await settle(action, input);
      setPending((p) => {
        const next = new Set(p);
        next.delete(key);
        return next;
      });
      if (result.ok) {
        optionsRef.current.onSuccess?.(result.data, input);
      } else {
        if (typeof undo === "function") undo();
        const message = result.error ?? "Something went wrong.";
        setError(message);
        optionsRef.current.onError?.(message, input);
      }
      return result;
    },
    [action],
  );

  return {
    run,
    /** Whether any run, or the run with this key, is in flight. */
    isPending: (key?: string) => (key === undefined ? pending.size > 0 : pending.has(key)),
    /** The last failure's message. */
    error,
  };
}
