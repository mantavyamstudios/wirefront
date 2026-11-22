// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { Separator } from "@wirefront/ui/separator";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { SignUpInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("glassSignUp.<key>"). */
export const GLASS_SIGN_UP_MESSAGES = {
  title: "Make something.",
  subtitle: "Sign up in seconds — no credit card.",
  or: "Or",
  email: "Email",
  emailPlaceholder: "you@example.com",
  password: "Password",
  showPassword: "Show password",
  hidePassword: "Hide password",
  required: "(required)",
  submit: "Create account",
  haveAccount: "Already have an account?",
  signIn: "Sign in",
};

export interface GlassSignUpProvider {
  id: string;
  name: string;
  icon?: ReactNode;
}

export interface GlassSignUpProps {
  /**
   * Create the account. The values are already validated. Resolve on
   * success; resolve with `fail(message, { email?, password? })` or throw to
   * show what went wrong.
   */
  onSignUp: Action<SignUpInput>;
  /** Called after the account is created, e.g. to show a verify-email page. */
  onSuccess?: (input: SignUpInput) => void;
  /** OAuth providers shown above the form. Needs `onProvider`. */
  providers?: GlassSignUpProvider[];
  /** Start signing up with a provider (receives its id). Usually redirects. */
  onProvider?: Action<string>;
  /** Where "Sign in" goes. Hidden when not given. */
  signInHref?: string;
  /** Your logo (drawn on a dark background). */
  logo?: ReactNode;
}

// The card is always dark glass, so errors use the dark-theme destructive tone.
const fieldError = "text-destructive-foreground text-xs";
const label = "font-medium text-sm text-white/85 leading-none";

function Required({ t }: { t: typeof GLASS_SIGN_UP_MESSAGES }) {
  return (
    <>
      <span aria-hidden className="text-white/45">
        *
      </span>{" "}
      <span className="sr-only">{t.required}</span>
    </>
  );
}

function BlobBackground() {
  // Larger movement range, faster cycle, and per-blob hue-rotate so colours
  // drift through neighbours instead of returning identically every loop.
  // Filter is set INSIDE the keyframes so the animation owns blur + hue —
  // don't add `filter: blur(...)` inline or it'll override the animation.
  const styles = `
@keyframes glass-blob-1 {
  0%   { transform: translate(-30%, -25%) scale(1);    filter: blur(80px) hue-rotate(0deg); }
  50%  { transform: translate(35%, 25%) scale(1.25);   filter: blur(80px) hue-rotate(40deg); }
  100% { transform: translate(-30%, -25%) scale(1);    filter: blur(80px) hue-rotate(0deg); }
}
@keyframes glass-blob-2 {
  0%   { transform: translate(30%, 35%) scale(1.1);    filter: blur(80px) hue-rotate(0deg); }
  50%  { transform: translate(-30%, -25%) scale(0.85); filter: blur(80px) hue-rotate(-50deg); }
  100% { transform: translate(30%, 35%) scale(1.1);    filter: blur(80px) hue-rotate(0deg); }
}
@keyframes glass-blob-3 {
  0%   { transform: translate(20%, -35%) scale(0.9);   filter: blur(80px) hue-rotate(0deg); }
  50%  { transform: translate(-35%, 30%) scale(1.2);   filter: blur(80px) hue-rotate(60deg); }
  100% { transform: translate(20%, -35%) scale(0.9);   filter: blur(80px) hue-rotate(0deg); }
}
@keyframes glass-blob-4 {
  0%   { transform: translate(-40%, 30%) scale(1);     filter: blur(80px) hue-rotate(0deg); }
  50%  { transform: translate(35%, -35%) scale(1.18);  filter: blur(80px) hue-rotate(-45deg); }
  100% { transform: translate(-40%, 30%) scale(1);     filter: blur(80px) hue-rotate(0deg); }
}
@keyframes glass-blob-5 {
  0%   { transform: translate(0%, 40%) scale(1.1);     filter: blur(80px) hue-rotate(0deg); }
  50%  { transform: translate(20%, -25%) scale(0.8);   filter: blur(80px) hue-rotate(70deg); }
  100% { transform: translate(0%, 40%) scale(1.1);     filter: blur(80px) hue-rotate(0deg); }
}
.glass-bg-blob-1 { animation: glass-blob-1 14s ease-in-out infinite; will-change: transform, filter; }
.glass-bg-blob-2 { animation: glass-blob-2 16s ease-in-out infinite; will-change: transform, filter; }
.glass-bg-blob-3 { animation: glass-blob-3 12s ease-in-out infinite; will-change: transform, filter; }
.glass-bg-blob-4 { animation: glass-blob-4 18s ease-in-out infinite; will-change: transform, filter; }
.glass-bg-blob-5 { animation: glass-blob-5 11s ease-in-out infinite; will-change: transform, filter; }
@media (prefers-reduced-motion: reduce) {
  .glass-bg-blob-1, .glass-bg-blob-2, .glass-bg-blob-3,
  .glass-bg-blob-4, .glass-bg-blob-5 { animation: none; }
}
`;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <style>{styles}</style>
      <div
        className="glass-bg-blob-1 absolute top-[-20vmax] inset-s-[-15vmax] h-[60vmax] w-[60vmax] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(236,72,153,0.55), rgba(236,72,153,0) 70%)",
        }}
      />
      <div
        className="glass-bg-blob-2 absolute top-[10vmax] inset-e-[-20vmax] h-[60vmax] w-[60vmax] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.5), rgba(139,92,246,0) 70%)",
        }}
      />
      <div
        className="glass-bg-blob-3 absolute bottom-[-25vmax] inset-s-[10vmax] h-[60vmax] w-[60vmax] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(20,184,166,0.45), rgba(20,184,166,0) 70%)",
        }}
      />
      <div
        className="glass-bg-blob-4 absolute top-[30vmax] inset-s-[20vmax] h-[60vmax] w-[60vmax] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(245,158,11,0.4), rgba(245,158,11,0) 70%)",
        }}
      />
      <div
        className="glass-bg-blob-5 absolute bottom-[-20vmax] inset-e-[-10vmax] h-[60vmax] w-[60vmax] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(56,189,248,0.45), rgba(56,189,248,0) 70%)",
        }}
      />
    </div>
  );
}

function GlassSignUpScreen({
  onSignUp,
  onSuccess,
  providers = [],
  onProvider,
  signInHref,
  logo,
}: GlassSignUpProps) {
  const t = useMessages("glassSignUp", GLASS_SIGN_UP_MESSAGES);
  const [reveal, setReveal] = useState(false);
  const form = useActionForm({
    schema: SignUpInput,
    action: onSignUp,
    onSuccess: (_, input) => onSuccess?.(input),
  });
  const provider = useAction(onProvider ?? (async () => {}));
  const shown = onProvider ? providers : [];

  return (
    <div className="dark relative flex min-h-svh items-center-safe justify-center overflow-hidden bg-[#0a0a0c] px-4 py-10 text-white">
      <BlobBackground />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/15 bg-white/6 p-5 shadow-2xl backdrop-blur-lg backdrop-saturate-150 sm:p-8 sm:backdrop-blur-xl">
        {logo ? <div className="flex justify-center">{logo}</div> : null}
        <div
          className={cn(
            "flex flex-col items-center text-center",
            logo && "mt-7"
          )}
        >
          <h1 className="font-heading text-3xl tracking-tight">{t.title}</h1>
          <p className="mt-2 text-sm text-white/65">{t.subtitle}</p>
        </div>

        {shown.length ? (
          <>
            <div
              className={cn(
                "mt-7 grid gap-2.5",
                shown.length > 1 && "grid-cols-2"
              )}
            >
              {shown.map((p) => (
                <button
                  aria-busy={provider.isPending(p.id)}
                  className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-white/15 bg-white/8 px-3 text-sm text-white transition-colors hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-default disabled:opacity-60"
                  disabled={provider.isPending()}
                  key={p.id}
                  onClick={() => void provider.run(p.id, p.id)}
                  type="button"
                >
                  <span className="size-4 shrink-0 [&_svg]:size-4">
                    {provider.isPending(p.id) ? <Spinner /> : p.icon}
                  </span>
                  <span className="truncate whitespace-nowrap">{p.name}</span>
                </button>
              ))}
            </div>
            {provider.error ? (
              <p className={cn(fieldError, "mt-3")} role="alert">
                {provider.error}
              </p>
            ) : null}
            <div className="my-6 flex items-center gap-3">
              <Separator className="flex-1 bg-white/15" />
              <span className="font-mono text-[10px] text-white/55 uppercase tracking-[0.3em]">
                {t.or}
              </span>
              <Separator className="flex-1 bg-white/15" />
            </div>
          </>
        ) : (
          <div className="mt-7" />
        )}

        <Form className="flex flex-col gap-4" noValidate {...form.formProps}>
          <Field.Root className="flex flex-col gap-2" name="email">
            <Field.Label className={label}>
              {t.email}
              <Required t={t} />
            </Field.Label>
            <Input
              autoComplete="email"
              className="border-white/15 bg-white/6 text-white placeholder:text-white/50 hover:bg-white/8 focus-visible:border-white/30"
              inputMode="email"
              placeholder={t.emailPlaceholder}
              type="email"
            />
            <Field.Error className={fieldError} />
          </Field.Root>
          <Field.Root className="flex flex-col gap-2" name="password">
            <Field.Label className={label}>
              {t.password}
              <Required t={t} />
            </Field.Label>
            <InputGroup className="border-white/15 bg-white/6 text-white focus-within:border-white/30 hover:bg-white/8">
              <InputGroupInput
                autoComplete="new-password"
                className="text-white placeholder:text-white/50"
                placeholder="••••••••"
                type={reveal ? "text" : "password"}
              />
              <InputGroupAddon align="inline-end">
                <button
                  aria-label={reveal ? t.hidePassword : t.showPassword}
                  aria-pressed={reveal}
                  className="cursor-pointer rounded p-1 text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 pointer-coarse:p-2"
                  onClick={() => setReveal((v) => !v)}
                  type="button"
                >
                  {reveal ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </InputGroupAddon>
            </InputGroup>
            <Field.Error className={fieldError} />
          </Field.Root>
          {form.formError ? (
            <p className={fieldError} role="alert">
              {form.formError}
            </p>
          ) : null}
          <Button
            aria-busy={form.pending}
            className="mt-2 border-transparent bg-white text-[#0a0a0c] hover:bg-white/90 **:data-[slot=button-loading-indicator]:text-[#0a0a0c]"
            disabled={form.pending}
            size="lg"
            type="submit"
          >
            {form.pending ? <Spinner data-icon="inline-start" /> : null}
            {t.submit}
          </Button>
        </Form>

        {signInHref ? (
          <p className="mt-6 text-center text-white/65 text-xs">
            {t.haveAccount}{" "}
            <WirefrontLink
              className="text-white underline underline-offset-2 hover:text-white"
              href={signInHref}
            >
              {t.signIn}
            </WirefrontLink>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function GlassSignUp(props: GlassSignUpProps) {
  return (
    <ScreenBoundary name="GlassSignUp">
      <GlassSignUpScreen {...props} />
    </ScreenBoundary>
  );
}
