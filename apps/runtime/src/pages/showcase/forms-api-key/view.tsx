// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckIcon, CopyIcon, KeyIcon, TerminalIcon } from "lucide-react";
import { useId, useState } from "react";

import { type NewApiKey, NewApiKeyInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("createApiKey.<key>"). */
export const CREATE_API_KEY_MESSAGES = {
  eyebrow: "API · new key",
  title: "Create an API key.",
  description: "Issue a token for a script, integration, or CLI. Scope it tightly.",
  name: "Name",
  namePlaceholder: "e.g. CI deploy bot",
  nameHint: "For your own bookkeeping — visible to admins only.",
  scopes: "Scopes",
  scopesHint: "Pick the smallest set this key actually needs.",
  destructive: "Destructive",
  expiry: "Expires after",
  days: "{count} days",
  dayOne: "1 day",
  years: "{count} years",
  yearOne: "1 year",
  never: "Never",
  selectedOne: "1 scope selected",
  selected: "{count} scopes selected",
  cancel: "Cancel",
  generate: "Generate key",
  createdTitle: "Your new key.",
  createdDescription: "Copy it now — you won’t see this again.",
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Couldn’t copy. Select the key and copy it.",
  done: "Done",
};

export interface ApiScope {
  /** The scope as the API names it, e.g. "read:projects". */
  id: string;
  description?: string;
  /** Marks scopes that can delete or change access. */
  destructive?: boolean;
}

export interface ApiScopeGroup {
  id: string;
  label: string;
  scopes: ApiScope[];
}

export interface CreateApiKeyProps {
  scopeGroups: ApiScopeGroup[];
  /** Scopes ticked when the form opens. */
  defaultScopes?: string[];
  /** Expiry choices in days. */
  expiryOptions?: number[];
  /** Offer a key that never expires. */
  allowNever?: boolean;
  defaultExpiryDays?: number | null;
  /** Create the key and return its secret, which the screen shows once. */
  onCreate: Action<NewApiKeyInput, NewApiKey>;
  /** Leave the form. The button hides without it. */
  onCancel?: () => void;
  /** After the secret is shown. Without it, "Done" returns to an empty form. */
  onDone?: (key: NewApiKey) => void;
  className?: string;
}

function CreateApiKeyScreen({
  scopeGroups,
  defaultScopes = [],
  expiryOptions = [7, 30, 90, 365],
  allowNever = true,
  defaultExpiryDays = 90,
  onCreate,
  onCancel,
  onDone,
  className,
}: CreateApiKeyProps) {
  const t = useMessages("createApiKey", CREATE_API_KEY_MESSAGES);
  const id = useId();
  const [scopes, setScopes] = useState<ReadonlySet<string>>(() => new Set(defaultScopes));
  const [expiry, setExpiry] = useState(defaultExpiryDays === null ? "never" : String(defaultExpiryDays));
  const [created, setCreated] = useState<NewApiKey>();
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const form = useActionForm({ schema: NewApiKeyInput, action: onCreate, onSuccess: (key) => setCreated(key) });

  const toggleScope = (scope: string, on: boolean) =>
    setScopes((s) => {
      const next = new Set(s);
      if (on) next.add(scope);
      else next.delete(scope);
      return next;
    });

  const expiryLabel = (days: number) =>
    days % 365 === 0
      ? days === 365
        ? t.yearOne
        : interpolate(t.years, { count: days / 365 })
      : days === 1
        ? t.dayOne
        : interpolate(t.days, { count: days });

  const copySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  };

  if (created) {
    return (
      <div className={cn("flex min-h-svh justify-center bg-background px-4 py-8 text-foreground sm:items-center sm:px-6", className)}>
        <div className="w-full max-w-md sm:rounded-2xl sm:border sm:border-border/60 sm:bg-background/60 sm:p-6">
          <div className="inline-flex size-10 items-center justify-center rounded-full bg-foreground/[0.06]">
            <KeyIcon aria-hidden className="size-5" />
          </div>
          <h2 className="mt-4 font-heading text-xl">{t.createdTitle}</h2>
          <p className="mt-1 text-muted-foreground text-sm">{t.createdDescription}</p>

          <div className="mt-5 flex items-start gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 font-mono text-[12px]">
            <TerminalIcon aria-hidden className="mt-0.5 size-3.5 shrink-0 opacity-50" />
            {/* Wraps on small screens so the whole secret can be checked. */}
            <span className="min-w-0 flex-1 break-all sm:truncate sm:break-normal">{created.secret}</span>
            <button
              className="inline-flex min-h-7 shrink-0 items-center gap-1 rounded px-2 text-[11px] text-muted-foreground uppercase tracking-[0.2em] transition-colors hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:min-h-11"
              onClick={() => void copySecret(created.secret)}
              type="button"
            >
              {copy === "copied" ? <CheckIcon aria-hidden className="size-3" /> : <CopyIcon aria-hidden className="size-3" />}
              {copy === "copied" ? t.copied : t.copy}
            </button>
          </div>
          <div aria-live="polite">
            {copy === "failed" ? (
              <p className="mt-2 text-destructive-foreground text-xs" role="alert">
                {t.copyFailed}
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              className="pointer-coarse:h-11 max-sm:w-full"
              onClick={() => {
                setCreated(undefined);
                setCopy("idle");
                onDone?.(created);
              }}
              type="button"
            >
              {t.done}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const scopeError = form.errors.scopes;

  return (
    // Top-aligned on phones so a tall form never loses its heading; the card
    // chrome only appears where there's room for it.
    <div className={cn("flex min-h-svh justify-center bg-background px-4 py-8 text-foreground sm:items-center sm:px-6 sm:py-16", className)}>
      <Form
        className="w-full max-w-lg sm:rounded-2xl sm:border sm:border-border/60 sm:bg-background/60 sm:p-6 sm:shadow-sm"
        errors={form.formProps.errors}
        noValidate
        onFormSubmit={(values) =>
          void form.submit({ ...values, scopes: [...scopes], expiresInDays: expiry === "never" ? null : Number(expiry) })
        }
      >
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
        <p className="mt-2 text-muted-foreground text-sm">{t.description}</p>

        <Field.Root className="mt-6 flex flex-col gap-1.5" name="name">
          <Field.Label className="font-medium text-sm leading-none">{t.name}</Field.Label>
          <Input placeholder={t.namePlaceholder} />
          <Field.Description className="text-muted-foreground text-xs">{t.nameHint}</Field.Description>
          <Field.Error className="text-destructive-foreground text-xs" />
        </Field.Root>

        <fieldset aria-describedby={`${id}-scopes-hint`} className="mt-6">
          <legend className="font-medium text-sm leading-none">{t.scopes}</legend>
          <p className="mt-0.5 text-muted-foreground text-xs" id={`${id}-scopes-hint`}>
            {t.scopesHint}
          </p>

          <div className="mt-3 flex flex-col gap-4">
            {scopeGroups.map((group) => (
              <div key={group.id}>
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{group.label}</div>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {group.scopes.map((s) => {
                    const checked = scopes.has(s.id);
                    return (
                      <li key={s.id}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                            checked
                              ? s.destructive
                                ? "border-destructive/40 bg-destructive/[0.04]"
                                : "border-foreground/30 bg-foreground/[0.03]"
                              : "border-border/60 bg-background/40 hover:border-border",
                          )}
                          htmlFor={`${id}-${s.id}`}
                        >
                          <Checkbox
                            aria-describedby={s.description ? `${id}-${s.id}-hint` : undefined}
                            aria-labelledby={`${id}-${s.id}-name`}
                            checked={checked}
                            className="mt-0.5"
                            id={`${id}-${s.id}`}
                            onCheckedChange={(on) => toggleScope(s.id, on)}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] text-foreground" id={`${id}-${s.id}-name`}>
                                {s.id}
                              </span>
                              {s.destructive ? (
                                <span className="rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] text-destructive-foreground uppercase tracking-[0.2em]">
                                  {t.destructive}
                                </span>
                              ) : null}
                            </div>
                            {s.description ? (
                              <p className="mt-0.5 text-muted-foreground text-xs" id={`${id}-${s.id}-hint`}>
                                {s.description}
                              </p>
                            ) : null}
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          {scopeError ? (
            <p className="mt-2 text-destructive-foreground text-xs" role="alert">
              {Array.isArray(scopeError) ? scopeError.join(" ") : scopeError}
            </p>
          ) : null}
        </fieldset>

        <div className="mt-6 flex flex-col gap-1.5">
          <label className="font-medium text-sm leading-none" htmlFor={`${id}-expiry`}>
            {t.expiry}
          </label>
          <div className="relative">
            <select
              className="h-9 w-full appearance-none rounded-lg border border-input bg-background ps-3 pe-9 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24 pointer-coarse:h-11"
              id={`${id}-expiry`}
              onChange={(e) => setExpiry(e.target.value)}
              value={expiry}
            >
              {expiryOptions.map((days) => (
                <option key={days} value={String(days)}>
                  {expiryLabel(days)}
                </option>
              ))}
              {allowNever ? <option value="never">{t.never}</option> : null}
            </select>
            <svg
              aria-hidden
              className="pointer-events-none absolute end-3 top-1/2 size-3.5 -translate-y-1/2 opacity-60"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              viewBox="0 0 16 16"
            >
              <polyline points="4 6 8 10 12 6" />
            </svg>
          </div>
        </div>

        {form.formError ? (
          <p className="mt-4 text-destructive-foreground text-sm" role="alert">
            {form.formError}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 border-border/60 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span aria-live="polite" className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em]">
            {scopes.size === 1 ? t.selectedOne : interpolate(t.selected, { count: scopes.size })}
          </span>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            {onCancel ? (
              <Button className="pointer-coarse:h-11" onClick={onCancel} size="sm" type="button" variant="ghost">
                {t.cancel}
              </Button>
            ) : null}
            <Button aria-busy={form.pending} className="pointer-coarse:h-11" disabled={form.pending} size="sm" type="submit">
              {form.pending ? <Spinner data-icon="inline-start" /> : null}
              {t.generate}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}

export function CreateApiKey(props: CreateApiKeyProps) {
  return (
    <ScreenBoundary name="CreateApiKey">
      <CreateApiKeyScreen {...props} />
    </ScreenBoundary>
  );
}
