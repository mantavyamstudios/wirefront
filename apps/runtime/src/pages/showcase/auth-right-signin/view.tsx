// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button } from "@wirefront/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@wirefront/ui/input-group";
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
import { Card } from "@wirefront/ui/card";
import { SignInInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("heroSignIn.<key>"). */
export const HERO_SIGN_IN_MESSAGES = {
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
  newHere: "New here?",
};

export interface SignInProvider {
  id: string;
  name: string;
  icon?: ReactNode;
}

export interface HeroSignInProps {
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
  /** The panel before the form from lg up, e.g. a product preview. The form fills the page without it. */
  hero?: ReactNode;
}

type FormProps = Pick<
  HeroSignInProps,
  "onSignIn" | "onSuccess" | "providers" | "onProvider"
> & { t: typeof HERO_SIGN_IN_MESSAGES; forgot?: ReactNode };

const fieldError = "text-destructive-foreground text-xs";

function Providers({
  providers = [],
  onProvider,
  t,
}: Pick<FormProps, "providers" | "onProvider" | "t">) {
  const provider = useAction(onProvider ?? (async () => {}));
  if (!onProvider || providers.length === 0) return null;
  return (
    <>
      <div
        className={cn("grid gap-2.5", providers.length > 1 && "grid-cols-2")}
      >
        {providers.map((p) => (
          <Button
            aria-busy={provider.isPending(p.id)}
            disabled={provider.isPending()}
            key={p.id}
            onClick={() => void provider.run(p.id, p.id)}
            type="button"
            variant="outline"
          >
            {provider.isPending(p.id) ? (
              <Spinner data-icon="inline-start" />
            ) : (
              p.icon
            )}
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
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          {t.orEmail}
        </span>
        <Separator className="flex-1" />
      </div>
    </>
  );
}

function SignInForm({ onSignIn, onSuccess, t, forgot }: FormProps) {
  const [reveal, setReveal] = useState(false);
  const form = useActionForm({
    schema: SignInInput,
    action: onSignIn,
    onSuccess: () => onSuccess?.(),
  });
  return (
    <Form className="flex flex-col gap-4" noValidate {...form.formProps}>
      <Field.Root className="flex flex-col gap-2" name="email">
        <Field.Label className="font-medium text-sm leading-none">
          {t.email}
        </Field.Label>
        <Input
          autoComplete="email"
          inputMode="email"
          placeholder={t.emailPlaceholder}
          type="email"
        />
        <Field.Error className={fieldError} />
      </Field.Root>
      <Field.Root className="flex flex-col gap-2" name="password">
        <Field.Label className="font-medium text-sm leading-none">
          {t.password}
        </Field.Label>
        <InputGroup>
          <InputGroupInput
            autoComplete="current-password"
            placeholder={t.passwordPlaceholder}
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
        className="mt-1 w-full"
        disabled={form.pending}
        size="lg"
        type="submit"
      >
        {form.pending ? <Spinner data-icon="inline-start" /> : null}
        {t.submit}
      </Button>
      {forgot}
    </Form>
  );
}

function HeroSignInScreen({
  forgotPasswordHref,
  signUpHref,
  logo,
  hero,
  ...form
}: HeroSignInProps) {
  const t = useMessages("heroSignIn", HERO_SIGN_IN_MESSAGES);
  return (
    <div
      className={cn(
        "grid min-h-svh grid-cols-1 bg-background text-foreground",
        hero && "lg:grid-cols-[1.2fr_minmax(440px,1fr)]"
      )}
    >
      {hero ? (
        <aside className="relative hidden overflow-hidden lg:flex lg:items-center lg:justify-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: [
                "radial-gradient(60% 50% at 18% 22%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 65%)",
                "radial-gradient(50% 50% at 82% 78%, color-mix(in oklch, var(--foreground) 6%, transparent), transparent 65%)",
              ].join(", "),
            }}
          />
          {hero}
        </aside>
      ) : null}
      <div
        className={cn(
          "flex items-center justify-center px-6 py-12 lg:px-12",
          hero && "lg:border-border/60 lg:border-s"
        )}
      >
        <Card className="w-full max-w-sm gap-0 px-5 py-8 shadow-sm sm:px-6">
          {logo ? (
            <div className="flex items-center justify-center">{logo}</div>
          ) : null}
          <div
            className={cn(
              "flex flex-col items-center gap-1.5 text-center",
              logo && "mt-5"
            )}
          >
            <h1 className="font-heading text-2xl tracking-tight">{t.title}</h1>
            <p className="text-muted-foreground text-sm">{t.subtitle}</p>
          </div>
          <div className="mt-6 flex flex-col gap-5">
            <Providers
              onProvider={form.onProvider}
              providers={form.providers}
              t={t}
            />
            <SignInForm {...form} t={t} />
          </div>
          {forgotPasswordHref || signUpHref ? (
            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 text-sm">
              {forgotPasswordHref ? (
                <WirefrontLink
                  className="whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground hover:underline"
                  href={forgotPasswordHref}
                >
                  {t.forgotPassword}
                </WirefrontLink>
              ) : null}
              {signUpHref ? (
                <p className="whitespace-nowrap text-muted-foreground">
                  {t.newHere}{" "}
                  <WirefrontLink
                    className="text-foreground underline underline-offset-4"
                    href={signUpHref}
                  >
                    {t.signUp}
                  </WirefrontLink>
                </p>
              ) : null}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

export function HeroSignIn(props: HeroSignInProps) {
  return (
    <ScreenBoundary name="HeroSignIn">
      <HeroSignInScreen {...props} />
    </ScreenBoundary>
  );
}
