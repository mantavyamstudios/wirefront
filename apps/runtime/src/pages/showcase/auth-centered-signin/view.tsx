// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button } from "@wirefront/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { Input } from "@wirefront/ui/input";
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
import { Card, CardContent, CardHeader } from "@wirefront/ui/card";
import { SignInInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("centeredSignIn.<key>"). */
export const CENTERED_SIGN_IN_MESSAGES = {
  title: "Welcome back",
  subtitle: "Sign in to your account",
  orEmail: "Or continue with email",
  email: "Email",
  emailPlaceholder: "you@example.com",
  password: "Password",
  passwordPlaceholder: "Enter your password",
  showPassword: "Show password",
  hidePassword: "Hide password",
  submit: "Sign in",
  forgotPassword: "Forgot password?",
  noAccount: "Don’t have an account?",
  signUp: "Sign up",
};

export interface SignInProvider {
  id: string;
  name: string;
  icon?: ReactNode;
}

export interface CenteredSignInProps {
  /**
   * Sign in with email and password. The values are already validated.
   * Resolve on success; resolve with `fail(message, { email?, password? })`
   * or throw to show what went wrong.
   */
  onSignIn: Action<SignInInput>;
  /** Called after a successful sign-in, e.g. to navigate into the app. */
  onSuccess?: () => void;
  /** OAuth providers shown above the form. Needs `onProvider`. */
  providers?: SignInProvider[];
  /** Start signing in with a provider (receives its id). Usually redirects. */
  onProvider?: Action<string>;
  /** Where "Forgot password?" goes. Hidden when not given. */
  forgotPasswordHref?: string;
  /** Where "Sign up" goes. Hidden when not given. */
  signUpHref?: string;
  /** Your logo. */
  logo?: ReactNode;
}

type FormProps = Pick<CenteredSignInProps, "onSignIn" | "onSuccess" | "providers" | "onProvider"> & { t: typeof CENTERED_SIGN_IN_MESSAGES; forgot?: ReactNode };

const fieldError = "text-destructive-foreground text-xs";

function Providers({ providers = [], onProvider, t }: Pick<FormProps, "providers" | "onProvider" | "t">) {
  const provider = useAction(onProvider ?? (async () => {}));
  if (!onProvider || providers.length === 0) return null;
  return (
    <>
      <div className={cn("grid gap-2.5", providers.length > 1 && "grid-cols-2")}>
        {providers.map((p) => (
          <Button aria-busy={provider.isPending(p.id)} disabled={provider.isPending()} key={p.id} onClick={() => void provider.run(p.id, p.id)} type="button" variant="outline">
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
  );
}

function SignInForm({ onSignIn, onSuccess, t, forgot }: FormProps) {
  const [reveal, setReveal] = useState(false);
  const form = useActionForm({ schema: SignInInput, action: onSignIn, onSuccess: () => onSuccess?.() });
  return (
    <Form className="flex flex-col gap-4" noValidate {...form.formProps}>
      <Field.Root className="flex flex-col gap-2" name="email">
        <Field.Label className="font-medium text-sm leading-none">{t.email}</Field.Label>
        <Input autoComplete="email" inputMode="email" placeholder={t.emailPlaceholder} type="email" />
        <Field.Error className={fieldError} />
      </Field.Root>
      <Field.Root className="flex flex-col gap-2" name="password">
        <Field.Label className="font-medium text-sm leading-none">{t.password}</Field.Label>
        <InputGroup>
          <InputGroupInput autoComplete="current-password" placeholder={t.passwordPlaceholder} type={reveal ? "text" : "password"} />
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
        <Field.Error className={fieldError} />
      </Field.Root>
      {form.formError ? (
        <p className={fieldError} role="alert">
          {form.formError}
        </p>
      ) : null}
      <Button aria-busy={form.pending} className="mt-1 w-full" disabled={form.pending} size="lg" type="submit">
        {form.pending ? <Spinner data-icon="inline-start" /> : null}
        {t.submit}
      </Button>
      {forgot}
    </Form>
  );
}

function CenteredSignInScreen({ forgotPasswordHref, signUpHref, logo, ...form }: CenteredSignInProps) {
  const t = useMessages("centeredSignIn", CENTERED_SIGN_IN_MESSAGES);
  return (
    <div className="relative flex min-h-svh items-center-safe justify-center bg-background px-4 py-12 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background: [
            "radial-gradient(50% 40% at 0% 0%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 70%)",
            "radial-gradient(55% 45% at 100% 100%, color-mix(in oklch, var(--foreground) 8%, transparent), transparent 70%)",
          ].join(", "),
        }}
      />
      <div className="relative w-full max-w-sm">
        <Card className="p-5 sm:p-7">
          <CardHeader className="flex flex-col items-center gap-4 p-0 text-center">
            {logo}
            <div className="flex flex-col gap-1.5">
              <h1 className="font-heading text-2xl tracking-tight">{t.title}</h1>
              <p className="text-muted-foreground text-sm">{t.subtitle}</p>
            </div>
          </CardHeader>
          <CardContent className="mt-6 flex flex-col gap-5 p-0">
            <Providers onProvider={form.onProvider} providers={form.providers} t={t} />
            <SignInForm {...form} t={t} />
            {forgotPasswordHref || signUpHref ? (
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 text-xs">
                {forgotPasswordHref ? (
                  <WirefrontLink className="text-muted-foreground transition-colors hover:text-foreground hover:underline" href={forgotPasswordHref}>
                    {t.forgotPassword}
                  </WirefrontLink>
                ) : null}
                {signUpHref ? (
                  <p className="text-muted-foreground">
                    {t.noAccount}{" "}
                    <WirefrontLink className="text-foreground underline underline-offset-4" href={signUpHref}>
            {t.signUp}
          </WirefrontLink>
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CenteredSignIn(props: CenteredSignInProps) {
  return (
    <ScreenBoundary name="CenteredSignIn">
      <CenteredSignInScreen {...props} />
    </ScreenBoundary>
  );
}
