// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@wirefront/ui/card";
import { Input } from "@wirefront/ui/input";
import { Label } from "@wirefront/ui/label";
import { cn } from "@wirefront/ui/lib/utils";
import { OTPField, OTPFieldInput, OTPFieldSeparator } from "@wirefront/ui/otp-field";
import { Spinner } from "@wirefront/ui/spinner";
import { Switch } from "@wirefront/ui/switch";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { LifeBuoyIcon } from "lucide-react";
import { useId, useState } from "react";

import { CODE_LENGTH, type Session, TwoFactorInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("twoFactor.<key>"). */
export const TWO_FACTOR_MESSAGES = {
  step: "Step 2 of 2",
  title: "Two-factor authentication",
  codeHint: "Open your authenticator app and enter the {length}-digit code.",
  recoveryHint: "Enter one of your one-time recovery codes.",
  code: "Authentication code",
  digit: "Digit {n} of {length}",
  recoveryCode: "Recovery code",
  remember: "Remember this device for {days} days",
  verify: "Verify",
  useRecovery: "Use a recovery code instead",
  useApp: "Try authenticator app instead",
  lostAccess: "Lost access?",
  contactSupport: "Contact support",
};

export interface TwoFactorProps {
  /**
   * Check the code and finish signing in. Receives the method ("totp" or
   * "recovery"), the code and, for app codes, whether to remember the device.
   * Resolve with the session (or nothing) on success; resolve with
   * `fail(message)` or throw to show what went wrong.
   */
  onVerify: Action<TwoFactorInput, Session>;
  /** Called after signing in, e.g. to navigate to `session.redirectTo`. */
  onSuccess?: (session: Session | undefined) => void;
  /** Offer "Remember this device for N days". Hidden when not given. */
  rememberDays?: number;
  /** Where "Contact support" goes. Hidden when not given. */
  supportHref?: string;
  className?: string;
}

function BrandMark() {
  const id = useId();
  return (
    <svg aria-hidden className="size-9" fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect fill={`url(#${id}-bg)`} height="64" rx="14" width="64" />
      <g transform="translate(32 32) rotate(-25)">
        <path d="M -23 0 A 23 8 0 0 1 23 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.45" strokeWidth="1.8" />
      </g>
      <circle cx="32" cy="32" fill={`url(#${id}-sphere)`} r="13" />
      <g transform="translate(32 32) rotate(-25)">
        <path d="M 23 0 A 23 8 0 0 1 -23 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.85" strokeWidth="1.8" />
      </g>
      <defs>
        <radialGradient cx="50%" cy="15%" id={`${id}-bg`} r="95%">
          <stop offset="0%" stopColor="#1d1d2c" />
          <stop offset="100%" stopColor="#0a0a0f" />
        </radialGradient>
        <linearGradient id={`${id}-sphere`} x1="20%" x2="80%" y1="20%" y2="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#b9b9d2" />
          <stop offset="100%" stopColor="#5a5a78" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const DIGITS = Array.from({ length: CODE_LENGTH }, (_, i) => `d${i}`);

function TwoFactorScreen({ onVerify, onSuccess, rememberDays, supportHref, className }: TwoFactorProps) {
  const t = useMessages("twoFactor", TWO_FACTOR_MESSAGES);
  const id = useId();
  const [method, setMethod] = useState<TwoFactorInput["method"]>("totp");
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [remember, setRemember] = useState(false);
  const [invalid, setInvalid] = useState<string>();
  const verify = useAction(onVerify, { onSuccess: (session) => onSuccess?.(session) });

  const switchMethod = () => {
    setMethod((m) => (m === "totp" ? "recovery" : "totp"));
    setCode("");
    setRecoveryCode("");
    setInvalid(undefined);
  };

  const submit = (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (verify.isPending()) return;
    const input =
      method === "totp" ? { method, code, rememberDevice: rememberDays ? remember : false } : { method, code: recoveryCode };
    const parsed = TwoFactorInput.safeParse(input);
    if (!parsed.success) {
      setInvalid(parsed.error.issues[0]?.message);
      return;
    }
    setInvalid(undefined);
    void verify.run(parsed.data);
  };

  const busy = verify.isPending();
  const error = invalid ?? verify.error;
  const ready = method === "totp" ? code.length === CODE_LENGTH : recoveryCode.trim().length >= 8;
  const half = Math.ceil(CODE_LENGTH / 2);

  return (
    <div className={cn("flex min-h-svh items-start justify-center bg-background px-4 py-10 sm:items-center-safe", className)}>
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center gap-4 text-center">
          <BrandMark />
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.step}</span>
            <h1 className="font-heading text-2xl tracking-tight">{t.title}</h1>
            <p className="text-muted-foreground text-sm">
              {method === "totp" ? interpolate(t.codeHint, { length: CODE_LENGTH }) : t.recoveryHint}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-5" noValidate onSubmit={submit}>
            {method === "totp" ? (
              <>
                <div className="flex justify-center">
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
                </div>
                {rememberDays ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 pointer-coarse:min-h-12">
                    <Label className="flex-1 cursor-pointer font-normal text-sm" htmlFor={`${id}-remember`}>
                      {interpolate(t.remember, { days: rememberDays })}
                    </Label>
                    <Switch checked={remember} id={`${id}-remember`} onCheckedChange={setRemember} />
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Label className="sr-only" htmlFor={`${id}-recovery`}>
                  {t.recoveryCode}
                </Label>
                <Input
                  aria-describedby={error ? `${id}-error` : undefined}
                  aria-invalid={error ? true : undefined}
                  autoComplete="one-time-code"
                  className="text-center font-mono tracking-[0.2em]"
                  disabled={busy}
                  id={`${id}-recovery`}
                  onChange={(e) => {
                    setRecoveryCode(e.target.value);
                    setInvalid(undefined);
                  }}
                  placeholder="xxxxx-xxxxx"
                  type="text"
                  value={recoveryCode}
                />
              </div>
            )}

            {error ? (
              <p className="-mt-2 text-center text-destructive-foreground text-xs" id={`${id}-error`} role="alert">
                {error}
              </p>
            ) : null}

            <Button aria-busy={busy} className="w-full" disabled={!ready || busy} size="lg" type="submit">
              {busy ? <Spinner data-icon="inline-start" /> : null}
              {t.verify}
            </Button>

            <button
              className="min-h-8 text-center text-muted-foreground text-sm transition-colors hover:text-foreground hover:underline pointer-coarse:min-h-11"
              onClick={switchMethod}
              type="button"
            >
              {method === "totp" ? t.useRecovery : t.useApp}
            </button>
          </form>
        </CardContent>

        {supportHref ? (
          <CardFooter className="justify-center">
            <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <LifeBuoyIcon className="size-3.5" />
              {t.lostAccess}{" "}
              <WirefrontLink className="underline hover:text-foreground" href={supportHref}>
                {t.contactSupport}
              </WirefrontLink>
            </p>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  );
}

export function TwoFactor(props: TwoFactorProps) {
  return (
    <ScreenBoundary name="TwoFactor">
      <TwoFactorScreen {...props} />
    </ScreenBoundary>
  );
}
