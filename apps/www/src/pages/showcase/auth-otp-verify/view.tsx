// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wirefront/ui/card";
import { cn } from "@wirefront/ui/lib/utils";
import { OTPField, OTPFieldInput, OTPFieldSeparator } from "@wirefront/ui/otp-field";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ChevronLeftIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { CODE_LENGTH, OtpInput, type Session } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("otpVerify.<key>"). */
export const OTP_VERIFY_MESSAGES = {
  cancel: "Cancel",
  title: "Enter your code",
  subtitle: "We sent a {length}-digit code to {email}",
  code: "One-time code",
  digit: "Digit {n} of {length}",
  resendIn: "Resend in {time}",
  resend: "Resend code",
  verify: "Verify",
  verifying: "Verifying",
  otherMethod: "Try a different method →",
};

export interface OtpVerifyProps {
  /** Where the code was sent. */
  email: string;
  /**
   * Check the code and sign in. Resolve with the session (or nothing) on
   * success; resolve with `fail(message)` or throw to show what went wrong.
   */
  onVerify: Action<OtpInput, Session>;
  /** Called after signing in, e.g. to navigate to `session.redirectTo`. */
  onSuccess?: (session: Session | undefined) => void;
  /** Send a new code. The resend control only shows when this is given. */
  onResend?: Action;
  /** Seconds before "Resend code" is offered (again). */
  resendAfter?: number;
  /** Where "Cancel" goes. Hidden when not given. */
  cancelHref?: string;
  /** Another way to sign in (password, passkey…). Hidden when not given. */
  otherMethodHref?: string;
  className?: string;
}

function formatTime(totalSeconds: number) {
  return `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, "0")}`;
}

function BrandMark() {
  return (
    <svg aria-hidden className="size-9 text-foreground" fill="none" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" opacity="0.55" r="16" stroke="currentColor" strokeDasharray="2 3" strokeWidth="1.5" />
      <circle cx="20" cy="20" fill="currentColor" r="6" />
    </svg>
  );
}

const DIGITS = Array.from({ length: CODE_LENGTH }, (_, i) => `d${i}`);

export function OtpVerify({ email, onVerify, onSuccess, onResend, resendAfter = 45, cancelHref, otherMethodHref, className }: OtpVerifyProps) {
  const t = useMessages("otpVerify", OTP_VERIFY_MESSAGES);
  const id = useId();
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState<string>();
  const [left, setLeft] = useState(resendAfter);
  const verify = useAction(onVerify, { onSuccess: (session) => onSuccess?.(session) });
  const resend = useAction(onResend ?? (async () => {}), { onSuccess: () => setLeft(resendAfter) });

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  const submit = (value: string) => {
    if (verify.isPending()) return;
    const parsed = OtpInput.safeParse({ code: value });
    if (!parsed.success) {
      setInvalid(parsed.error.issues[0]?.message);
      return;
    }
    setInvalid(undefined);
    void verify.run(parsed.data);
  };
  const busy = verify.isPending();
  const error = invalid ?? verify.error ?? resend.error;
  const half = Math.ceil(CODE_LENGTH / 2);

  return (
    <div className={cn("flex min-h-svh items-start justify-center bg-background px-4 py-10 sm:items-center-safe", className)}>
      <div className="w-full max-w-sm">
        {cancelHref ? (
          <WirefrontLink
            className="mb-3 inline-flex min-h-8 items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground pointer-coarse:min-h-11"
            href={cancelHref}
          >
            <ChevronLeftIcon className="size-3.5" />
            {t.cancel}
          </WirefrontLink>
        ) : null}

        <Card>
          <CardHeader className="items-center text-center">
            <div className="flex justify-center">
              <BrandMark />
            </div>
            <CardTitle className="mt-4 font-heading text-2xl tracking-tight">{t.title}</CardTitle>
            <CardDescription className="text-sm">{interpolate(t.subtitle, { length: CODE_LENGTH, email })}</CardDescription>
          </CardHeader>

          <CardContent>
            <form
              className="flex flex-col gap-6"
              onSubmit={(event) => {
                event.preventDefault();
                submit(code);
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <label className="sr-only" htmlFor={`${id}-code`}>
                  {t.code}
                </label>
                <OTPField
                  aria-describedby={error ? `${id}-error` : undefined}
                  id={`${id}-code`}
                  disabled={busy}
                  length={CODE_LENGTH}
                  onValueChange={(value) => {
                    setCode(value);
                    setInvalid(undefined);
                  }}
                  onValueComplete={submit}
                  size="lg"
                  value={code}
                >
                  {DIGITS.map((key, i) => (
                    <span className="contents" key={key}>
                      {i === half && <OTPFieldSeparator />}
                      <OTPFieldInput aria-invalid={error ? true : undefined} aria-label={interpolate(t.digit, { n: i + 1, length: CODE_LENGTH })} />
                    </span>
                  ))}
                </OTPField>
                {error ? (
                  <p className="text-center text-destructive-foreground text-xs" id={`${id}-error`} role="alert">
                    {error}
                  </p>
                ) : null}
              </div>

              {onResend ? (
                <div className="flex justify-center text-xs">
                  {left > 0 ? (
                    <span className="text-muted-foreground tabular-nums">{interpolate(t.resendIn, { time: formatTime(left) })}</span>
                  ) : (
                    <button
                      className="inline-flex min-h-8 items-center text-foreground underline-offset-4 transition-colors hover:underline pointer-coarse:min-h-11"
                      disabled={resend.isPending()}
                      onClick={() => void resend.run()}
                      type="button"
                    >
                      {t.resend}
                    </button>
                  )}
                </div>
              ) : null}

              <Button aria-busy={busy} className="w-full" disabled={code.length !== CODE_LENGTH || busy} size="lg" type="submit">
                {busy ? (
                  <>
                    <Spinner className="size-4" />
                    {t.verifying}
                  </>
                ) : (
                  t.verify
                )}
              </Button>

              {otherMethodHref ? (
                <div className="flex justify-center">
                  <WirefrontLink className="text-muted-foreground text-xs transition-colors hover:text-foreground" href={otherMethodHref}>
                    {t.otherMethod}
                  </WirefrontLink>
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

