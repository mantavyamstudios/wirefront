// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { Building2Icon, CheckIcon, EyeIcon, EyeOffIcon, FingerprintIcon } from "lucide-react";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { MagicLinkInput, type Session, SignInInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("signIn.<key>"). */
export const SIGN_IN_MESSAGES = {
  title: "Sign in to {product}",
  subtitle: "Welcome back. Pick up where you left off.",
  passkey: "Passkey",
  sso: "SSO",
  or: "or",
  email: "Email",
  emailPlaceholder: "you@company.com",
  password: "Password",
  passwordPlaceholder: "Your password",
  forgotPassword: "Forgot password?",
  showPassword: "Show password",
  hidePassword: "Hide password",
  submit: "Sign in",
  signedIn: "Signed in",
  magicLink: "Email me a sign-in link",
  magicLinkSent: "Check {email} for a sign-in link.",
  continueWith: "Continue with {provider}",
  noAccount: "Don’t have an account?",
  signUp: "Sign up",
};

export interface SignInProvider {
  id: string;
  name: string;
  icon?: ReactNode;
}

export interface SignInProps {
  /** Your product's name, shown in the heading. */
  product: string;
  /** Your logo. Defaults to a neutral mark. */
  logo?: ReactNode;
  /** Prefill the email field (e.g. the last account used on this device). */
  defaultEmail?: string;
  /**
   * Sign in with email and password. Resolve with the session (or nothing) on
   * success; resolve with `fail(message, { email?, password? })` or throw to
   * show what went wrong. The values are already validated with SignInInput.
   */
  onSignIn: Action<SignInInput, Session>;
  /** Sign in with a passkey. The Passkey button only shows when this is given. */
  onPasskey?: Action<void, Session>;
  /** Email a one-time sign-in link. The "Email me a sign-in link" button only shows when this is given. */
  onMagicLink?: Action<MagicLinkInput>;
  /** OAuth providers to offer, e.g. [{ id: "google", name: "Google", icon: <GoogleLogo /> }]. Needs `onProvider`. */
  providers?: SignInProvider[];
  /** Start signing in with a provider (receives its id). Usually redirects; resolve with a session if it doesn't. */
  onProvider?: Action<string, Session>;
  /** Called after a successful sign-in, e.g. to navigate to `session.redirectTo`. */
  onSuccess?: (session: Session | undefined) => void;
  /** An error that arrived with the page, such as an expired session or a failed SSO callback. */
  error?: string;
  /** Where "Forgot password?" goes. Hidden when not given. */
  forgotPasswordHref?: string;
  /** Where "Sign up" goes. Hidden when not given. */
  signUpHref?: string;
  /** Where the SSO button goes (your identity provider's start URL). Hidden when not given. */
  ssoHref?: string;
  className?: string;
}

function Mark() {
  return (
    <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs/5">
      <svg aria-hidden className="size-6" fill="none" viewBox="0 0 28 28">
        <path d="M7 18.5 12 12l3.5 4.5 2-2.5 3.5 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      </svg>
    </span>
  );
}

const noPasskey: Action<void, Session> = async () => {};
const noMagicLink: Action<MagicLinkInput> = async () => {};
const noProvider: Action<string, Session> = async () => {};

export function SignIn({
  product,
  logo,
  defaultEmail,
  onSignIn,
  onPasskey,
  onMagicLink,
  providers = [],
  onProvider,
  onSuccess,
  error,
  forgotPasswordHref,
  signUpHref,
  ssoHref,
  className,
}: SignInProps) {
  const t = useMessages("signIn", SIGN_IN_MESSAGES);
  const id = useId();
  const reduce = useReducedMotion();
  const shake = useAnimationControls();
  const [reveal, setReveal] = useState(false);
  const [done, setDone] = useState(false);
  const [sentTo, setSentTo] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);

  const complete = (session: Session | undefined) => {
    setDone(true);
    onSuccess?.(session);
  };
  const form = useActionForm({ schema: SignInInput, action: onSignIn, onSuccess: complete });
  const passkey = useAction(onPasskey ?? noPasskey, { onSuccess: complete });
  const provider = useAction(onProvider ?? noProvider, { onSuccess: complete });
  const magic = useActionForm({
    schema: MagicLinkInput,
    action: onMagicLink ?? noMagicLink,
    onSuccess: (_, input) => setSentTo(input.email),
  });
  const sendMagicLink = () => {
    setSentTo(undefined);
    form.reset();
    void magic.submit({ email: formRef.current ? new FormData(formRef.current).get("email") : "" });
  };

  const failure = form.formError ?? magic.formError ?? passkey.error ?? provider.error ?? error;
  const errors = { ...form.errors, ...magic.errors };
  const hasFieldErrors = Object.keys(form.errors).length > 0;
  useEffect(() => {
    if ((form.formError || hasFieldErrors || passkey.error) && !reduce) {
      void shake.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.36 } });
    }
  }, [form.formError, hasFieldErrors, passkey.error, reduce, shake]);

  const busy = form.pending || magic.pending || passkey.isPending() || provider.isPending();
  const shownProviders = onProvider ? providers : [];
  const options = (onPasskey ? 1 : 0) + shownProviders.length + (ssoHref ? 1 : 0);
  // Two per row; an odd last option takes the full row.
  const optionClass = (index: number) => (options > 1 && options % 2 === 1 && index === options - 1 ? "col-span-2" : undefined);
  const fieldError = "text-destructive-foreground text-xs";
  const linkClass =
    "rounded-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className={cn("flex h-[760px] w-full flex-col overflow-y-auto bg-background px-6 py-10 text-foreground", className)}>
      <div className="m-auto flex w-full max-w-[340px] flex-col items-center">
        {logo ?? <Mark />}
        <h1 className="mt-6 text-balance text-center font-semibold text-xl tracking-tight">{interpolate(t.title, { product })}</h1>
        <p className="mt-1.5 text-balance text-center text-muted-foreground text-sm">{t.subtitle}</p>

        {options > 0 ? (
          <>
            <div className={cn("mt-8 grid w-full gap-2", options > 1 ? "grid-cols-2" : "grid-cols-1")}>
              {onPasskey ? (
                <Button
                  aria-busy={passkey.isPending()}
                  className={optionClass(0)}
                  disabled={done || busy}
                  onClick={() => void passkey.run()}
                  type="button"
                  variant="outline"
                >
                  {passkey.isPending() ? <Spinner data-icon="inline-start" /> : <FingerprintIcon />}
                  {t.passkey}
                </Button>
              ) : null}
              {shownProviders.map((p, i) => (
                <Button
                  aria-busy={provider.isPending(p.id)}
                  aria-label={interpolate(t.continueWith, { provider: p.name })}
                  className={optionClass((onPasskey ? 1 : 0) + i)}
                  disabled={done || busy}
                  key={p.id}
                  onClick={() => void provider.run(p.id, p.id)}
                  type="button"
                  variant="outline"
                >
                  {provider.isPending(p.id) ? <Spinner data-icon="inline-start" /> : p.icon}
                  {p.name}
                </Button>
              ))}
              {ssoHref ? (
                <WirefrontLink className={cn(buttonVariants({ variant: "outline" }), optionClass(options - 1))} href={ssoHref}>
                  <Building2Icon />
                  {t.sso}
                </WirefrontLink>
              ) : null}
            </div>
            <div className="my-6 flex w-full items-center gap-3 text-muted-foreground text-xs">
              <span className="h-px flex-1 bg-border" />
              {t.or}
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        ) : (
          <div className="mt-8" />
        )}

        <Form className="flex w-full flex-col gap-4" noValidate ref={formRef} {...form.formProps} errors={errors}>
          <Field.Root className="flex flex-col gap-2" disabled={done} name="email">
            <Field.Label className="font-medium text-sm">{t.email}</Field.Label>
            <Input
              autoComplete="email"
              defaultValue={defaultEmail}
              inputMode="email"
              placeholder={t.emailPlaceholder}
              type="text"
            />
            <Field.Error className={fieldError} />
          </Field.Root>
          <motion.div animate={shake}>
            <Field.Root className="flex flex-col gap-2" disabled={done} name="password">
              <div className="flex items-center justify-between">
                <Field.Label className="font-medium text-sm">{t.password}</Field.Label>
                {forgotPasswordHref ? (
                  <WirefrontLink className={cn(linkClass, "text-muted-foreground text-sm hover:text-foreground")} href={forgotPasswordHref}>
                    {t.forgotPassword}
                  </WirefrontLink>
                ) : null}
              </div>
              <InputGroup>
                <InputGroupInput
                  autoComplete="current-password"
                  placeholder={t.passwordPlaceholder}
                  type={reveal ? "text" : "password"}
                />
                <InputGroupAddon align="inline-end">
                  <button
                    aria-label={reveal ? t.hidePassword : t.showPassword}
                    className="flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setReveal((value) => !value)}
                    type="button"
                  >
                    {reveal ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  </button>
                </InputGroupAddon>
              </InputGroup>
              <Field.Error className={fieldError} />
            </Field.Root>
          </motion.div>
          {failure ? (
            <p className={fieldError} id={`${id}-error`} role="alert">
              {failure}
            </p>
          ) : null}
          {sentTo ? (
            <p className="text-muted-foreground text-xs" role="status">
              {interpolate(t.magicLinkSent, { email: sentTo })}
            </p>
          ) : null}
          <Button
            aria-busy={form.pending}
            className={cn("mt-2 w-full", done && "pointer-events-none")}
            disabled={busy}
            type="submit"
          >
            {form.pending ? <Spinner data-icon="inline-start" /> : null}
            {done ? (
              <motion.span animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2" initial={reduce ? false : { opacity: 0, scale: 0.9 }}>
                <CheckIcon />
                {t.signedIn}
              </motion.span>
            ) : (
              t.submit
            )}
          </Button>
          {onMagicLink ? (
            <Button aria-busy={magic.pending} className="w-full" disabled={done || busy} onClick={sendMagicLink} type="button" variant="ghost">
              {magic.pending ? <Spinner data-icon="inline-start" /> : null}
              {t.magicLink}
            </Button>
          ) : null}
        </Form>

        {signUpHref ? (
          <p className="mt-8 text-center text-muted-foreground text-sm">
            {t.noAccount}{" "}
            <WirefrontLink className={cn(linkClass, "font-medium text-foreground underline-offset-4 hover:underline")} href={signUpHref}>
              {t.signUp}
            </WirefrontLink>
          </p>
        ) : null}
      </div>
    </div>
  );
}
