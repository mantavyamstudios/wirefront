// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button } from "@wirefront/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@wirefront/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckIcon, ChevronLeftIcon, EyeIcon, EyeOffIcon, TriangleAlertIcon } from "lucide-react";
import { type ReactNode, useState } from "react";

import { NewPasswordForm, PASSWORD_MIN_LENGTH, type ResetPasswordInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("resetPassword.<key>"). */
export const RESET_PASSWORD_MESSAGES = {
  title: "Choose a new password",
  subtitle: "Use at least {count} characters. You’ll stay signed in on this device.",
  password: "New password",
  confirm: "Confirm password",
  showPasswords: "Show passwords",
  hidePasswords: "Hide passwords",
  submit: "Update password",
  doneTitle: "Password updated",
  doneDescription: "Use your new password the next time you sign in.",
  continue: "Continue to sign in",
  expiredTitle: "This link has expired",
  requestNew: "Request a new link",
  backToSignIn: "Back to sign in",
};

export interface ResetPasswordProps {
  /** The token from the reset link (e.g. the `token` query parameter). */
  token: string;
  /**
   * Set the new password. Receives the token and the password (already
   * checked against the confirmation). Resolve with nothing on success;
   * resolve with `fail(message)` or throw to show what went wrong.
   */
  onReset: Action<ResetPasswordInput>;
  /** Called after the password is updated. */
  onSuccess?: () => void;
  /**
   * Why the link can't be used, if you already know (e.g. you checked the token
   * when the page loaded). Shows the expired-link state instead of the form.
   */
  linkError?: string;
  /** Where "Request a new link" goes (your forgot-password page). Hidden when not given. */
  forgotPasswordHref?: string;
  /** Where "Back to sign in" and "Continue to sign in" go. Hidden when not given. */
  signInHref?: string;
  className?: string;
}

function BrandMark() {
  return (
    <div className="flex items-center justify-center">
      <div className="flex size-8 items-center justify-center rounded-md bg-foreground">
        <span className="block size-2 rounded-full bg-background" />
      </div>
    </div>
  );
}

export function ResetPassword({ token, onReset, onSuccess, linkError, forgotPasswordHref, signInHref, className }: ResetPasswordProps) {
  const t = useMessages("resetPassword", RESET_PASSWORD_MESSAGES);
  const [reveal, setReveal] = useState(false);
  const [done, setDone] = useState(false);
  const form = useActionForm({
    schema: NewPasswordForm,
    action: ({ password }) => onReset({ token, password }),
    onSuccess: () => {
      setDone(true);
      onSuccess?.();
    },
  });
  const fieldError = "text-destructive-foreground text-xs";
  const backLink = signInHref ? (
    <CardFooter className="justify-center">
      <WirefrontLink className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground" href={signInHref}>
        <ChevronLeftIcon className="size-3.5" />
        {t.backToSignIn}
      </WirefrontLink>
    </CardFooter>
  ) : null;

  let content: ReactNode;
  if (linkError) {
    content = (
      <>
        <CardHeader className="items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <TriangleAlertIcon className="size-6 text-destructive-foreground" />
          </div>
          <CardTitle className="mt-4 font-heading text-2xl tracking-tight">{t.expiredTitle}</CardTitle>
          <CardDescription className="text-sm">{linkError}</CardDescription>
        </CardHeader>
        {forgotPasswordHref ? (
          <CardContent>
            <Button className="w-full" nativeButton={false} render={<WirefrontLink href={forgotPasswordHref} />} size="lg">
              {t.requestNew}
            </Button>
          </CardContent>
        ) : null}
        {backLink}
      </>
    );
  } else if (done) {
    content = (
      <>
        <CardHeader className="items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckIcon className="size-6 text-emerald-700 dark:text-emerald-400" />
          </div>
          <CardTitle className="mt-4 font-heading text-2xl tracking-tight">{t.doneTitle}</CardTitle>
          <CardDescription className="text-sm">{t.doneDescription}</CardDescription>
        </CardHeader>
        {signInHref ? (
          <CardContent>
            <Button className="w-full" nativeButton={false} render={<WirefrontLink href={signInHref} />} size="lg">
              {t.continue}
            </Button>
          </CardContent>
        ) : null}
      </>
    );
  } else {
    const passwordField = (name: "password" | "confirm", label: string, autoComplete: string) => (
      <Field.Root className="flex flex-col gap-2" name={name}>
        <Field.Label className="font-medium text-sm">{label}</Field.Label>
        <InputGroup>
          <InputGroupInput autoComplete={autoComplete} type={reveal ? "text" : "password"} />
          {name === "password" ? (
            <InputGroupAddon align="inline-end">
              <button
                aria-label={reveal ? t.hidePasswords : t.showPasswords}
                aria-pressed={reveal}
                className="flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setReveal((value) => !value)}
                type="button"
              >
                {reveal ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
        <Field.Error className={fieldError} />
      </Field.Root>
    );
    content = (
      <>
        <CardHeader className="items-center text-center">
          <BrandMark />
          <CardTitle className="mt-4 font-heading text-2xl tracking-tight">{t.title}</CardTitle>
          <CardDescription className="text-sm">{interpolate(t.subtitle, { count: PASSWORD_MIN_LENGTH })}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form className="flex flex-col gap-4" noValidate {...form.formProps}>
            {passwordField("password", t.password, "new-password")}
            {passwordField("confirm", t.confirm, "new-password")}
            {form.formError ? (
              <p className={fieldError} role="alert">
                {form.formError}
              </p>
            ) : null}
            <Button aria-busy={form.pending} className="mt-1" disabled={form.pending} size="lg" type="submit">
              {form.pending ? <Spinner data-icon="inline-start" /> : null}
              {t.submit}
            </Button>
          </Form>
        </CardContent>
        {backLink}
      </>
    );
  }

  return (
    <div className={cn("flex min-h-svh items-center-safe justify-center bg-background px-4 py-16", className)}>
      <Card className="w-full max-w-sm">{content}</Card>
    </div>
  );
}
