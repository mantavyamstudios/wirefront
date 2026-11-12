// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

/**
 * The form pattern every Wirefront form follows (SCREEN-CONTRACT.md, rule 5):
 * Base UI's <Form> collects the values, the screen's zod schema validates them,
 * the builder's action saves them, and field errors from either end up on the
 * right fields.
 *
 *   const form = useActionForm({ schema: InviteInput, action: onInvite, onSuccess: close });
 *   <Form {...form.formProps}>
 *     <Field.Root name="email">…</Field.Root>
 *     {form.formError ? <p role="alert">{form.formError}</p> : null}
 *     <Button type="submit" disabled={form.pending}>Invite</Button>
 *   </Form>
 */
import { useCallback, useRef, useState } from "react";
import { type z, flattenError } from "zod";

import { type Action, type FieldErrors, settle } from "./types";

export interface ActionFormOptions<Schema extends z.ZodType, Output> {
  schema: Schema;
  action: Action<z.output<Schema>, Output>;
  onSuccess?: (data: Output, values: z.output<Schema>) => void;
}

export function useActionForm<Schema extends z.ZodType, Output = void>({
  schema,
  action,
  onSuccess,
}: ActionFormOptions<Schema, Output>) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);
  // Ignore a second submit while one is in flight.
  const inFlight = useRef(false);

  const submit = useCallback(
    async (values: Record<string, unknown>) => {
      if (inFlight.current) return;
      const parsed = schema.safeParse(values);
      if (!parsed.success) {
        setErrors(flattenError(parsed.error).fieldErrors as FieldErrors);
        setFormError(undefined);
        return;
      }
      inFlight.current = true;
      setPending(true);
      setErrors({});
      setFormError(undefined);
      const result = await settle(action, parsed.data);
      inFlight.current = false;
      setPending(false);
      if (result.ok) {
        onSuccess?.(result.data, parsed.data);
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
      }
    },
    [schema, action, onSuccess],
  );

  const reset = useCallback(() => {
    setErrors({});
    setFormError(undefined);
  }, []);

  return {
    /** Spread onto Base UI's <Form>. */
    formProps: { errors, onFormSubmit: submit },
    /** Field errors (client validation or the action's fieldErrors). */
    errors,
    /** A form-level error from the action, for a role="alert" message. */
    formError,
    /** True while the action runs: disable the submit button and show progress. */
    pending,
    submit,
    reset,
  };
}
