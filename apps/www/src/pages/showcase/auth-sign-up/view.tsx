// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useId, useState } from "react";

import { type Account, PASSWORD_MIN_LENGTH, SignUpInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("signUp.<key>"). */
export const SIGN_UP_MESSAGES = {
  title: "Create your {product} account",
  subtitle: "Free for your first three projects. No card needed.",
  name: "Name",
  namePlaceholder: "Ada Lindqvist",
  email: "Work email",
  emailPlaceholder: "you@company.com",
  password: "Password",
  passwordPlaceholder: "Create a password",
  passwordHint: "At least {count} characters",
  showPassword: "Show password",
  hidePassword: "Hide password",
  submit: "Create account",
  created: "Account created",
  agreeBefore: "By continuing you agree to the",
  terms: "Terms",
  and: "and",
  privacy: "Privacy Policy",
  haveAccount: "Already have an account?",
  signIn: "Sign in",
};

export interface SignUpProps {
  /** Your product's name, shown in the heading. */
  product: string;
  /** Your logo. Defaults to a neutral mark. */
  logo?: ReactNode;
  /**
   * Create the account. The values are already validated with SignUpInput.
   * Resolve with the account (or nothing) on success; resolve with
   * `fail(message, { email?, password? })` or throw to show what went wrong.
   */
  onSignUp: Action<SignUpInput, Account>;
  /** Called after the account is created, e.g. to navigate to `account.redirectTo`. */
  onSuccess?: (account: Account | undefined) => void;
  /** Where "Sign in" goes. Hidden when not given. */
  signInHref?: string;
  /** Your terms and privacy policy. The agreement line shows when both are given. */
  termsHref?: string;
  privacyHref?: string;
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

const linkClass =
  "rounded-sm text-foreground underline decoration-border underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring";

export function SignUp({ product, logo, onSignUp, onSuccess, signInHref, termsHref, privacyHref, className }: SignUpProps) {
  const t = useMessages("signUp", SIGN_UP_MESSAGES);
  const id = useId();
  const reduce = useReducedMotion();
  const [reveal, setReveal] = useState(false);
  const [length, setLength] = useState(0);
  const [done, setDone] = useState(false);
  const form = useActionForm({
    schema: SignUpInput,
    action: onSignUp,
    onSuccess: (account) => {
      setDone(true);
      onSuccess?.(account);
    },
  });

  const longEnough = length >= PASSWORD_MIN_LENGTH;
  const tooShort = Boolean(form.errors.password);
  const fieldError = "text-destructive-foreground text-xs";

  return (
    <div className={cn("flex h-[760px] w-full flex-col overflow-y-auto bg-background px-6 py-10 text-foreground", className)}>
      <div className="m-auto flex w-full max-w-[340px] flex-col items-center">
        {logo ?? <Mark />}
        <h1 className="mt-6 text-balance text-center font-semibold text-xl tracking-tight">{interpolate(t.title, { product })}</h1>
        <p className="mt-1.5 text-balance text-center text-muted-foreground text-sm">{t.subtitle}</p>

        <Form className="mt-8 flex w-full flex-col gap-4" noValidate {...form.formProps}>
          <Field.Root className="flex flex-col gap-2" disabled={done} name="name">
            <Field.Label className="font-medium text-sm">{t.name}</Field.Label>
            <Input autoComplete="name" placeholder={t.namePlaceholder} />
            <Field.Error className={fieldError} />
          </Field.Root>
          <Field.Root className="flex flex-col gap-2" disabled={done} name="email">
            <Field.Label className="font-medium text-sm">{t.email}</Field.Label>
            <Input autoComplete="email" inputMode="email" placeholder={t.emailPlaceholder} type="text" />
            <Field.Error className={fieldError} />
          </Field.Root>
          <Field.Root className="flex flex-col gap-2" disabled={done} name="password">
            <Field.Label className="font-medium text-sm">{t.password}</Field.Label>
            <InputGroup>
              <InputGroupInput
                aria-describedby={`${id}-hint`}
                autoComplete="new-password"
                onChange={(e) => setLength(e.target.value.length)}
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
            <p
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                longEnough ? "text-success-foreground" : tooShort ? "text-destructive-foreground" : "text-muted-foreground",
              )}
              id={`${id}-hint`}
            >
              <span
                className={cn(
                  "flex size-3.5 items-center justify-center rounded-full border transition-colors",
                  longEnough ? "border-success bg-success text-white" : "border-current/40",
                )}
              >
                {longEnough ? (
                  <motion.span
                    animate={{ scale: 1 }}
                    className="flex"
                    initial={reduce ? false : { scale: 0.4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 24 }}
                  >
                    <CheckIcon className="size-2.5" strokeWidth={3} />
                  </motion.span>
                ) : null}
              </span>
              {interpolate(t.passwordHint, { count: PASSWORD_MIN_LENGTH })}
            </p>
          </Field.Root>
          {form.formError ? (
            <p className={fieldError} role="alert">
              {form.formError}
            </p>
          ) : null}
          <Button aria-busy={form.pending} className={cn("mt-2 w-full", done && "pointer-events-none")} disabled={form.pending} type="submit">
            {form.pending ? <Spinner data-icon="inline-start" /> : null}
            {done ? (
              <motion.span animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2" initial={reduce ? false : { opacity: 0, scale: 0.9 }}>
                <CheckIcon />
                {t.created}
              </motion.span>
            ) : (
              t.submit
            )}
          </Button>
          {termsHref && privacyHref ? (
            <p className="text-balance text-center text-muted-foreground text-xs leading-relaxed">
              {t.agreeBefore}{" "}
              <WirefrontLink className={linkClass} href={termsHref}>
                {t.terms}
              </WirefrontLink>{" "}
              {t.and}{" "}
              <WirefrontLink className={linkClass} href={privacyHref}>
                {t.privacy}
              </WirefrontLink>
              .
            </p>
          ) : null}
        </Form>

        {signInHref ? (
          <p className="mt-8 text-center text-muted-foreground text-sm">
            {t.haveAccount}{" "}
            <WirefrontLink
              className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
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
