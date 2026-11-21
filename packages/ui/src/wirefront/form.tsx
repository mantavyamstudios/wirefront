// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

/**
 * The form pattern every Wirefront form follows (SCREEN-CONTRACT.md, rule 5):
 * Base UI's <Form> collects the values, the screen's schema validates them,
 * the builder's action saves them, and field errors from either end up on the
 * right fields.
 *
 * Any Standard Schema validator works (https://standardschema.dev): the shipped
 * screens use zod, and a builder can pass a Valibot, ArkType or zod/mini schema
 * of the same shape instead.
 *
 *   const form = useActionForm({ schema: InviteInput, action: onInvite, onSuccess: close });
 *   <Form {...form.formProps}>
 *     <Field.Root name="email">…</Field.Root>
 *     {form.formError ? <p role="alert">{form.formError}</p> : null}
 *     <Button type="submit" disabled={form.pending}>Invite</Button>
 *   </Form>
 */
import { useCallback, useRef, useState } from "react";

import { type Action, type FieldErrors, settle } from "./types";

/** The Standard Schema v1 interface, copied from the spec so no package is needed. */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (value: unknown) => StandardResult<Output> | Promise<StandardResult<Output>>;
    readonly types?: { readonly input: Input; readonly output: Output } | undefined;
  };
}
type StandardIssue = { readonly message: string; readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined };
type StandardResult<Output> = { readonly value: Output; readonly issues?: undefined } | { readonly issues: ReadonlyArray<StandardIssue> };
/** The validated value type of a Standard Schema. */
export type SchemaOutput<Schema extends StandardSchemaV1> = NonNullable<Schema["~standard"]["types"]>["output"];

/** Groups issues by their first path segment, like zod's flattenError; issues without a path are form-level. */
function flattenIssues(issues: ReadonlyArray<StandardIssue>) {
  const fieldErrors: Record<string, string[]> = {};
  const formErrors: string[] = [];
  for (const issue of issues) {
    const first = issue.path?.[0];
    const key = first === undefined ? undefined : typeof first === "object" ? first.key : first;
    if (key === undefined) formErrors.push(issue.message);
    else {
      const name = String(key);
      fieldErrors[name] = [...(fieldErrors[name] ?? []), issue.message];
    }
  }
  return { fieldErrors, formErrors };
}

export interface ActionFormOptions<Schema extends StandardSchemaV1, Output> {
  schema: Schema;
  action: Action<SchemaOutput<Schema>, Output>;
  onSuccess?: (data: Output, values: SchemaOutput<Schema>) => void;
}

export function useActionForm<Schema extends StandardSchemaV1, Output = void>({
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
      // Validation may be async (Standard Schema allows it), so hold the guard from here.
      inFlight.current = true;
      let parsed: StandardResult<unknown>;
      try {
        parsed = await schema["~standard"].validate(values);
      } catch (error) {
        // A throwing validator is a bug in the schema: free the form and let the error surface.
        inFlight.current = false;
        throw error;
      }
      if (parsed.issues) {
        inFlight.current = false;
        const { fieldErrors, formErrors } = flattenIssues(parsed.issues);
        setErrors(fieldErrors);
        // Errors no rendered field can show (the key wasn't submitted, or the
        // schema refined the whole object) go to the form-level message, so a
        // failed validation is never silent.
        const orphaned = Object.entries(fieldErrors)
          .filter(([key]) => !(key in values))
          .flatMap(([, messages]) => messages);
        const unshown = [...formErrors, ...orphaned];
        setFormError(unshown.length ? unshown.join(" ") : undefined);
        return;
      }
      setPending(true);
      setErrors({});
      setFormError(undefined);
      const data = parsed.value as SchemaOutput<Schema>;
      const result = await settle(action, data);
      inFlight.current = false;
      setPending(false);
      if (result.ok) {
        onSuccess?.(result.data, data);
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
