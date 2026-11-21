// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button } from "@wirefront/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@wirefront/ui/card";
import { Checkbox } from "@wirefront/ui/checkbox";
import { Input } from "@wirefront/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { Separator } from "@wirefront/ui/separator";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { type Action, fail } from "@wirefront/ui/wirefront/types";
import { CheckIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { PASSWORD_MIN_LENGTH, SignUpInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("centeredSignUp.<key>"). */
export const CENTERED_SIGN_UP_MESSAGES = {
  title: "Create your account",
  subtitle: "It only takes a minute.",
  orEmail: "Or sign up with email",
  name: "Full name",
  namePlaceholder: "Ada Lovelace",
  email: "Email",
  emailPlaceholder: "you@example.com",
  password: "Password",
  passwordPlaceholder: "At least {min} characters",
  showPassword: "Show password",
  hidePassword: "Hide password",
  strength: "Password strength:",
  weak: "Weak",
  ok: "OK",
  strong: "Strong",
  agree: "I agree to the",
  terms: "Terms",
  and: "and",
  privacy: "Privacy",
  mustAgree: "Agree to the terms to continue.",
  submit: "Create account",
  haveAccount: "Already have an account?",
  signIn: "Sign in",
};

export interface SignUpProvider {
  id: string;
  name: string;
  icon?: ReactNode;
}

export interface CenteredSignUpProps {
  /**
   * Create the account. The values are already validated (and the terms
   * agreed to, when shown). Resolve on success; resolve with
   * `fail(message, { name?, email?, password? })` or throw to show what went wrong.
   */
  onSignUp: Action<SignUpInput>;
  /** Called after the account is created, e.g. to show a verify-email page. */
  onSuccess?: (input: SignUpInput) => void;
  /** OAuth providers shown above the form. Needs `onProvider`. */
  providers?: SignUpProvider[];
  /** Start signing up with a provider (receives its id). Usually redirects. */
  onProvider?: Action<string>;
  /** Your terms and privacy policy. The agreement checkbox shows, and is required, when both are given. */
  termsHref?: string;
  privacyHref?: string;
  /** Where "Sign in" goes. Hidden when not given. */
  signInHref?: string;
  /** Short selling points above the card, e.g. ["Free for 14 days", "No credit card"]. */
  highlights?: string[];
  /** Your logo. */
  logo?: ReactNode;
}

type Strength = "weak" | "ok" | "strong";

/** A rough guide only: length plus a digit and a symbol. Your backend decides what it accepts. */
function strengthOf(password: string): Strength | undefined {
  if (!password) return undefined;
  const digit = /\d/.test(password);
  const symbol = /[^\w\s]/.test(password);
  if (password.length >= 12 || (password.length >= PASSWORD_MIN_LENGTH && digit && symbol)) return "strong";
  if (password.length >= PASSWORD_MIN_LENGTH && (digit || symbol)) return "ok";
  return "weak";
}

const STRENGTH: Record<Strength, { segments: number; bar: string; text: string }> = {
  weak: { segments: 1, bar: "bg-category-3", text: "text-category-3-foreground" },
  ok: { segments: 2, bar: "bg-category-1", text: "text-category-1-foreground" },
  strong: { segments: 3, bar: "bg-category-2", text: "text-category-2-foreground" },
};

const fieldError = "text-destructive-foreground text-xs";
const link = "text-foreground underline underline-offset-4";

function CenteredSignUpScreen({ onSignUp, onSuccess, providers = [], onProvider, termsHref, privacyHref, signInHref, highlights = [], logo }: CenteredSignUpProps) {
  const t = useMessages("centeredSignUp", CENTERED_SIGN_UP_MESSAGES);
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const askTerms = Boolean(termsHref && privacyHref);
  const form = useActionForm({
    schema: SignUpInput,
    // The checkbox lives outside the form fields, so it is checked here.
    action: async (input: SignUpInput) => (askTerms && !agreed ? fail(t.mustAgree) : onSignUp(input)),
    onSuccess: (_, input) => onSuccess?.(input),
  });
  const provider = useAction(onProvider ?? (async () => {}));
  const shownProviders = onProvider ? providers : [];
  const strength = strengthOf(password);
  const meta = strength ? STRENGTH[strength] : undefined;

  return (
    <div className="relative min-h-svh overflow-x-clip bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute start-[-10%] top-[-10%] size-[24rem] rounded-full bg-primary/10 blur-3xl sm:size-[40rem]" />
        <div className="absolute end-[-10%] bottom-[-10%] size-[24rem] rounded-full bg-accent/15 blur-3xl sm:size-[40rem]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 50% at 50% 0%, color-mix(in oklch, var(--color-foreground) 4%, transparent), transparent 70%)" }} />
      </div>
      <div className="relative flex min-h-svh flex-col items-center justify-center-safe px-4 py-12">
        {highlights.length ? (
          <ul className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {highlights.map((label) => (
              <li
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] backdrop-blur-sm"
                key={label}
              >
                <CheckIcon aria-hidden className="size-3 text-category-2-foreground" />
                {label}
              </li>
            ))}
          </ul>
        ) : null}

        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            {logo ? <div className="mb-3 flex justify-center">{logo}</div> : null}
            <CardTitle className="font-heading text-2xl tracking-tight">
              <h1>{t.title}</h1>
            </CardTitle>
            <CardDescription>{t.subtitle}</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            {shownProviders.length ? (
              <>
                <div className={cn("grid gap-2.5", shownProviders.length > 1 && "grid-cols-2")}>
                  {shownProviders.map((p) => (
                    <Button aria-busy={provider.isPending(p.id)} disabled={provider.isPending()} key={p.id} onClick={() => void provider.run(p.id, p.id)} size="lg" type="button" variant="outline">
                      {provider.isPending(p.id) ? <Spinner data-icon="inline-start" /> : p.icon}
                      {p.name}
                    </Button>
                  ))}
                </div>
                {provider.error ? (
                  <p className={fieldError} role="alert">
                    {provider.error}
                  </p>
                ) : null}
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.orEmail}</span>
                  <Separator className="flex-1" />
                </div>
              </>
            ) : null}

            <Form className="flex flex-col gap-4" noValidate {...form.formProps}>
              <Field.Root className="flex flex-col gap-2" name="name">
                <Field.Label className="font-medium text-sm leading-none">{t.name}</Field.Label>
                <Input autoComplete="name" placeholder={t.namePlaceholder} />
                <Field.Error className={fieldError} />
              </Field.Root>
              <Field.Root className="flex flex-col gap-2" name="email">
                <Field.Label className="font-medium text-sm leading-none">{t.email}</Field.Label>
                <Input autoComplete="email" inputMode="email" placeholder={t.emailPlaceholder} type="email" />
                <Field.Error className={fieldError} />
              </Field.Root>
              <Field.Root className="flex flex-col gap-2" name="password">
                <Field.Label className="font-medium text-sm leading-none">{t.password}</Field.Label>
                <InputGroup>
                  <InputGroupInput
                    autoComplete="new-password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={interpolate(t.passwordPlaceholder, { min: PASSWORD_MIN_LENGTH })}
                    type={reveal ? "text" : "password"}
                  />
                  <InputGroupAddon align="inline-end">
                    <button
                      aria-label={reveal ? t.hidePassword : t.showPassword}
                      aria-pressed={reveal}
                      className="cursor-pointer rounded p-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:p-2"
                      onClick={() => setReveal((v) => !v)}
                      type="button"
                    >
                      {reveal ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                    </button>
                  </InputGroupAddon>
                </InputGroup>
                <div className="mt-1 flex items-center gap-2">
                  <div aria-hidden className="flex flex-1 gap-1">
                    {(["weak", "ok", "strong"] as const).map((level, i) => (
                      <div className={cn("h-1.5 flex-1 rounded-full transition-colors", meta && i < meta.segments ? meta.bar : "bg-border")} key={level} />
                    ))}
                  </div>
                  <span aria-live="polite" className={cn("min-w-[3.5rem] text-end font-mono text-[10px] uppercase tracking-[0.2em]", meta?.text)}>
                    {strength ? (
                      <>
                        <span className="sr-only">{t.strength} </span>
                        {t[strength]}
                      </>
                    ) : null}
                  </span>
                </div>
                <Field.Error className={fieldError} />
              </Field.Root>

              {askTerms ? (
                <div className="flex items-start gap-2.5 pointer-coarse:min-h-11">
                  <Checkbox checked={agreed} className="mt-0.5" id={`${id}-terms`} onCheckedChange={(v) => setAgreed(v === true)} />
                  <label className="block text-muted-foreground text-sm leading-snug" htmlFor={`${id}-terms`}>
                    {t.agree}{" "}
                    <WirefrontLink className={link} href={termsHref ?? ""}>
                      {t.terms}
                    </WirefrontLink>{" "}
                    {t.and}{" "}
                    <WirefrontLink className={link} href={privacyHref ?? ""}>
                      {t.privacy}
                    </WirefrontLink>
                  </label>
                </div>
              ) : null}

              {form.formError ? (
                <p className={fieldError} role="alert">
                  {form.formError}
                </p>
              ) : null}
              <Button aria-busy={form.pending} className="mt-1 w-full" disabled={form.pending} size="lg" type="submit">
                {form.pending ? <Spinner data-icon="inline-start" /> : null}
                {t.submit}
              </Button>
            </Form>
          </CardContent>

          {signInHref ? (
            <CardFooter className="justify-center">
              <p className="text-muted-foreground text-sm">
                {t.haveAccount}{" "}
                <WirefrontLink className={link} href={signInHref}>
                  {t.signIn}
                </WirefrontLink>
              </p>
            </CardFooter>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

export function CenteredSignUp(props: CenteredSignUpProps) {
  return (
    <ScreenBoundary name="CenteredSignUp">
      <CenteredSignUpScreen {...props} />
    </ScreenBoundary>
  );
}
