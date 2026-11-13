// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import { Button, buttonVariants } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { OTPField, OTPFieldInput, OTPFieldSeparator } from "@wirefront/ui/otp-field";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckIcon, MailIcon } from "lucide-react";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useEffect, useId, useState } from "react";

import { CODE_LENGTH, VerifyEmailInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("verifyEmail.<key>"). */
export const VERIFY_EMAIL_MESSAGES = {
  title: "Check your email",
  subtitle: "Enter the {length}-digit code we sent to {email}",
  doneTitle: "Email verified",
  doneSubtitle: "{email} is confirmed. You’re all set.",
  code: "Verification code",
  digit: "Digit {n} of {length}",
  submit: "Verify email",
  continue: "Continue",
  resendIn: "Didn’t get a code? Resend in {time}",
  noCode: "Didn’t get a code?",
  resend: "Resend",
  wrongEmail: "Wrong email?",
  changeIt: "Change it",
};

export interface VerifyEmailProps {
  /** The address the code was sent to. */
  email: string;
  /**
   * Check the code. Called as soon as all digits are entered. Resolve with
   * nothing on success; resolve with `fail(message)` or throw to show what went wrong.
   */
  onVerify: Action<VerifyEmailInput>;
  /** Send a new code. The resend link only shows when this is given. */
  onResend?: Action;
  /** Seconds before "Resend" is offered (again). */
  resendAfter?: number;
  /** Called once the email is verified. */
  onSuccess?: () => void;
  /** Where "Continue" goes after verifying. Hidden when not given. */
  continueHref?: string;
  /** Where "Change it" goes (to fix a mistyped address). Hidden when not given. */
  changeEmailHref?: string;
  className?: string;
}

function Tile({ done }: { done: boolean }) {
  return (
    <span
      className={cn(
        "relative flex size-10 items-center justify-center overflow-hidden rounded-xl border shadow-xs/5 transition-colors duration-300",
        done ? "border-success/30 bg-success/10 text-success-foreground" : "bg-card text-foreground",
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          animate={{ opacity: 1, y: 0 }}
          className="flex"
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: 10 }}
          key={done ? "done" : "mail"}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
        >
          {done ? <CheckIcon className="size-5" /> : <MailIcon className="size-5" />}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const DIGITS = Array.from({ length: CODE_LENGTH }, (_, i) => `d${i}`);
const linkClass =
  "cursor-pointer rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring";

export function VerifyEmail({ email, onVerify, onResend, resendAfter = 30, onSuccess, continueHref, changeEmailHref, className }: VerifyEmailProps) {
  const t = useMessages("verifyEmail", VERIFY_EMAIL_MESSAGES);
  const id = useId();
  const reduce = useReducedMotion();
  const shake = useAnimationControls();
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState<string>();
  const [done, setDone] = useState(false);
  const [left, setLeft] = useState(resendAfter);

  const verify = useAction(onVerify, {
    onSuccess: () => {
      setDone(true);
      onSuccess?.();
    },
    onError: () => {
      if (!reduce) void shake.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.36 } });
    },
  });
  const resend = useAction(onResend ?? (async () => {}), { onSuccess: () => setLeft(resendAfter) });

  useEffect(() => {
    if (left <= 0 || done) return;
    const timer = setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, done]);

  const submit = (value: string) => {
    if (verify.isPending() || done) return;
    const parsed = VerifyEmailInput.safeParse({ code: value });
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
    <div className={cn("flex h-[760px] w-full flex-col overflow-y-auto bg-background px-6 py-10 text-foreground", className)}>
      <div className="m-auto flex w-full max-w-[340px] flex-col items-center">
        <Tile done={done} />
        <h1 className="mt-6 text-balance text-center font-semibold text-xl tracking-tight">{done ? t.doneTitle : t.title}</h1>
        <p className="mt-1.5 text-balance text-center text-muted-foreground text-sm">
          {interpolate(done ? t.doneSubtitle : t.subtitle, { email, length: CODE_LENGTH })}
        </p>

        <form
          className="mt-8 flex w-full flex-col items-center gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!done) submit(code);
          }}
        >
          <motion.div animate={shake}>
            <label className="sr-only" htmlFor={`${id}-code`}>
              {t.code}
            </label>
            <OTPField
              aria-describedby={error ? `${id}-error` : undefined}
              id={`${id}-code`}
              disabled={busy || done}
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
                  <OTPFieldInput
                    aria-invalid={error ? true : undefined}
                    aria-label={interpolate(t.digit, { n: i + 1, length: CODE_LENGTH })}
                    className={cn("transition-colors duration-300", done && "border-success/40 bg-success/6")}
                  />
                </span>
              ))}
            </OTPField>
          </motion.div>
          {error ? (
            <p className="-mt-1 text-center text-destructive-foreground text-xs" id={`${id}-error`} role="alert">
              {error}
            </p>
          ) : null}
          {done ? (
            continueHref ? (
              <WirefrontLink className={cn(buttonVariants(), "mt-2 w-full")} href={continueHref}>
                {t.continue}
              </WirefrontLink>
            ) : null
          ) : (
            <Button aria-busy={busy} className="mt-2 w-full" disabled={code.length < CODE_LENGTH || busy} type="submit">
              {busy ? <Spinner data-icon="inline-start" /> : null}
              {t.submit}
            </Button>
          )}
        </form>

        {!done && onResend ? (
          <p className="mt-6 text-center text-muted-foreground text-sm">
            {left > 0 ? (
              <span className="tabular-nums">{interpolate(t.resendIn, { time: `0:${String(left).padStart(2, "0")}` })}</span>
            ) : (
              <>
                {t.noCode}{" "}
                <button className={linkClass} disabled={resend.isPending()} onClick={() => void resend.run()} type="button">
                  {t.resend}
                </button>
              </>
            )}
          </p>
        ) : null}

        {changeEmailHref ? (
          <p className={cn("mt-8 text-center text-muted-foreground text-sm", done && "invisible")}>
            {t.wrongEmail}{" "}
            <WirefrontLink className={linkClass} href={changeEmailHref}>
              {t.changeIt}
            </WirefrontLink>
          </p>
        ) : null}
      </div>
    </div>
  );
}
