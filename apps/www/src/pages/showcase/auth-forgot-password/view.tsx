// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ArrowLeftIcon, KeyRoundIcon, MailCheckIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { ForgotPasswordInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("forgotPassword.<key>"). */
export const FORGOT_PASSWORD_MESSAGES = {
  title: "Forgot your password?",
  subtitle: "Enter your email and we’ll send you a link to reset it.",
  email: "Email",
  emailPlaceholder: "you@company.com",
  submit: "Send reset link",
  sentTitle: "Check your email",
  sentTo: "We sent a reset link to {email}.",
  expires: "It expires in {minutes} minutes.",
  backToSignIn: "Back to sign in",
  resendIn: "Didn’t get it? Resend in {time}",
  didntGetIt: "Didn’t get it?",
  resend: "Resend",
  sending: "Sending…",
  or: "or",
  anotherEmail: "use another email",
  remembered: "Remembered it?",
  signIn: "Sign in",
};

export interface ForgotPasswordProps {
  /** Prefill the email field, e.g. from the sign-in form. */
  defaultEmail?: string;
  /**
   * Send the reset link. The email is already validated. Resolve with nothing
   * on success (whether or not the address has an account); resolve with
   * `fail(message)` or throw to show what went wrong.
   */
  onSend: Action<ForgotPasswordInput>;
  /** Seconds before "Resend" is offered again. */
  resendAfter?: number;
  /** How long your reset links stay valid; mentioned in the confirmation when given. */
  expiresInMinutes?: number;
  /** Where "Sign in" goes. Hidden when not given. */
  signInHref?: string;
  className?: string;
}

const linkClass =
  "cursor-pointer rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring";

export function ForgotPassword({ defaultEmail, onSend, resendAfter = 30, expiresInMinutes, signInHref, className }: ForgotPasswordProps) {
  const t = useMessages("forgotPassword", FORGOT_PASSWORD_MESSAGES);
  const reduce = useReducedMotion();
  const [sentTo, setSentTo] = useState<string>();
  const [left, setLeft] = useState(0);
  const form = useActionForm({
    schema: ForgotPasswordInput,
    action: onSend,
    onSuccess: (_, input) => {
      setSentTo(input.email);
      setLeft(resendAfter);
    },
  });

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  const fieldError = "text-destructive-foreground text-xs";
  const failure = form.formError ? (
    <p className={fieldError} role="alert">
      {form.formError}
    </p>
  ) : null;

  return (
    <div className={cn("flex h-[760px] w-full flex-col overflow-y-auto bg-background px-6 py-10 text-foreground", className)}>
      <div className="m-auto flex w-full max-w-[340px] flex-col items-center">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full flex-col items-center"
            exit={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: 8 }}
            key={sentTo ? "sent" : "ask"}
            transition={reduce ? { duration: 0 } : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className="flex size-10 items-center justify-center rounded-xl border bg-card shadow-xs/5">
              {sentTo ? <MailCheckIcon className="size-5" /> : <KeyRoundIcon className="size-5" />}
            </span>
            <h1 className="mt-6 text-balance text-center font-semibold text-xl tracking-tight">{sentTo ? t.sentTitle : t.title}</h1>
            <p className="mt-1.5 text-balance text-center text-muted-foreground text-sm">
              {sentTo ? (
                <>
                  {interpolate(t.sentTo, { email: sentTo })}
                  {expiresInMinutes ? ` ${interpolate(t.expires, { minutes: expiresInMinutes })}` : null}
                </>
              ) : (
                t.subtitle
              )}
            </p>

            {sentTo ? (
              <div className="mt-8 flex w-full flex-col gap-4">
                {signInHref ? (
                  <WirefrontLink className={cn(buttonVariants({ variant: "outline" }), "w-full")} href={signInHref}>
                    <ArrowLeftIcon />
                    {t.backToSignIn}
                  </WirefrontLink>
                ) : null}
                {failure}
                <p className="text-center text-muted-foreground text-sm">
                  {left > 0 ? (
                    <span className="tabular-nums">{interpolate(t.resendIn, { time: `0:${String(left).padStart(2, "0")}` })}</span>
                  ) : (
                    <>
                      {t.didntGetIt}{" "}
                      <button className={linkClass} disabled={form.pending} onClick={() => void form.submit({ email: sentTo })} type="button">
                        {form.pending ? t.sending : t.resend}
                      </button>{" "}
                      {t.or}{" "}
                      <button className={linkClass} onClick={() => setSentTo(undefined)} type="button">
                        {t.anotherEmail}
                      </button>
                    </>
                  )}
                </p>
              </div>
            ) : (
              <Form className="mt-8 flex w-full flex-col gap-4" noValidate {...form.formProps}>
                <Field.Root className="flex flex-col gap-2" name="email">
                  <Field.Label className="font-medium text-sm">{t.email}</Field.Label>
                  <Input autoComplete="email" defaultValue={defaultEmail} inputMode="email" placeholder={t.emailPlaceholder} type="text" />
                  <Field.Error className={fieldError} />
                </Field.Root>
                {failure}
                <Button aria-busy={form.pending} className="mt-2 w-full" disabled={form.pending} type="submit">
                  {form.pending ? <Spinner data-icon="inline-start" /> : null}
                  {t.submit}
                </Button>
              </Form>
            )}
          </motion.div>
        </AnimatePresence>

        {signInHref ? (
          <p className="mt-8 text-center text-muted-foreground text-sm">
            {t.remembered}{" "}
            <WirefrontLink className={linkClass} href={signInHref}>
              {t.signIn}
            </WirefrontLink>
          </p>
        ) : null}
      </div>
    </div>
  );
}
