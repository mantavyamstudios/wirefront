// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { Card } from "@wirefront/ui/card";
import { cn } from "@wirefront/ui/lib/utils";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ExternalLinkIcon } from "lucide-react";
import { useEffect, useState } from "react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("magicLinkSent.<key>"). */
export const MAGIC_LINK_SENT_MESSAGES = {
  eyebrow: "Magic link sent",
  title: "Check your inbox",
  sentTo: "We sent a magic link to",
  instructions: "Click the link in the email to sign in.",
  expires: "The link expires in {minutes} minutes.",
  openMailApp: "Open {name}",
  resendIn: "Resend in {time}",
  resend: "Resend link",
  noLink: "Didn’t get it? Check your spam folder.",
  noLinkOr: "Didn’t get it? Check your spam folder, or",
  differentEmail: "use a different email",
};

export interface MagicLinkSentProps {
  /** Where the link was sent. */
  email: string;
  /** Send the link again. The resend button only shows when this is given. */
  onResend?: Action;
  /** Seconds before "Resend link" is offered (again). */
  resendAfter?: number;
  /** How long your links stay valid; mentioned when given. */
  expiresInMinutes?: number;
  /** A shortcut to the user's mail app (e.g. picked from the email's domain). Hidden when not given. */
  mailApp?: { name: string; href: string };
  /** Where "use a different email" goes. Hidden when not given. */
  changeEmailHref?: string;
  className?: string;
}

function formatCountdown(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function MagicLinkSent({ email, onResend, resendAfter = 30, expiresInMinutes, mailApp, changeEmailHref, className }: MagicLinkSentProps) {
  const t = useMessages("magicLinkSent", MAGIC_LINK_SENT_MESSAGES);
  const [left, setLeft] = useState(resendAfter);
  const resend = useAction(onResend ?? (async () => {}), { onSuccess: () => setLeft(resendAfter) });

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  return (
    <div className={cn("relative flex min-h-svh items-center-safe justify-center bg-background px-4 py-10", className)}>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [data-magic-float] { animation: none !important; }
        }
        @keyframes magic-float-a {
          0%, 100% { transform: translate(0, 0); opacity: 0.55; }
          50% { transform: translate(0, -6px); opacity: 0.95; }
        }
        @keyframes magic-float-b {
          0%, 100% { transform: translate(0, 0); opacity: 0.45; }
          50% { transform: translate(0, -8px); opacity: 0.85; }
        }
        @keyframes magic-float-c {
          0%, 100% { transform: translate(0, 0); opacity: 0.35; }
          50% { transform: translate(2px, -5px); opacity: 0.75; }
        }
        @keyframes magic-pulse-dot {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(50% 40% at 50% 0%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 70%)",
        }}
      />

      <Card className="relative z-10 w-full max-w-md p-5 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <EnvelopeArt />

          <div className="mt-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
          <h1 className="mt-3 font-heading text-3xl tracking-tight">{t.title}</h1>

          <p className="mt-3 text-muted-foreground text-sm">{t.sentTo}</p>
          <div className="mt-1 break-all font-mono text-base text-foreground">{email}</div>

          <p className="mt-4 max-w-xs text-muted-foreground text-xs leading-relaxed">
            {t.instructions}
            {expiresInMinutes ? ` ${interpolate(t.expires, { minutes: expiresInMinutes })}` : null}
          </p>

          {mailApp || onResend ? (
            <div className="mt-7 flex w-full flex-col gap-2">
              {mailApp ? (
                <Button
                  className="w-full"
                  nativeButton={false}
                  render={<a href={mailApp.href} rel="noreferrer" target="_blank" />}
                  size="lg"
                  variant="outline"
                >
                  {interpolate(t.openMailApp, { name: mailApp.name })}
                  <ExternalLinkIcon />
                </Button>
              ) : null}
              {onResend ? (
                <Button
                  aria-busy={resend.isPending()}
                  className="w-full"
                  disabled={left > 0 || resend.isPending()}
                  onClick={() => void resend.run()}
                  type="button"
                  variant="ghost"
                >
                  {left > 0 ? interpolate(t.resendIn, { time: formatCountdown(left) }) : t.resend}
                </Button>
              ) : null}
              {resend.error ? (
                <p className="text-destructive-foreground text-xs" role="alert">
                  {resend.error}
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="mt-6 text-muted-foreground text-xs">
            {changeEmailHref ? (
              <>
                {t.noLinkOr}{" "}
                <WirefrontLink className="underline hover:text-foreground" href={changeEmailHref}>
                  {t.differentEmail}
                </WirefrontLink>
                .
              </>
            ) : (
              t.noLink
            )}
          </p>
        </div>
      </Card>
    </div>
  );
}

function EnvelopeArt() {
  return (
    <div className="relative flex size-24 items-center justify-center">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-2 rounded-2xl bg-primary/10 motion-safe:animate-ping"
        style={{ animationDuration: "3s" }}
      />

      <span
        aria-hidden
        className="pointer-events-none absolute top-1 left-2 size-1 rounded-full bg-muted-foreground/60"
        data-magic-float
        style={{ animation: "magic-float-a 3s ease-in-out infinite" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-3 right-1 size-1.5 rounded-full bg-muted-foreground/50"
        data-magic-float
        style={{ animation: "magic-float-b 4s ease-in-out infinite 0.4s" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-2 left-0 size-1 rounded-full bg-muted-foreground/40"
        data-magic-float
        style={{ animation: "magic-float-c 3.6s ease-in-out infinite 0.8s" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-4 size-1 rounded-full bg-muted-foreground/55"
        data-magic-float
        style={{ animation: "magic-float-a 3.4s ease-in-out infinite 1.2s" }}
      />

      <div className="relative flex size-16 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
        <svg
          viewBox="0 0 20 16"
          aria-hidden
          className="h-8 w-10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="1" y="2" width="18" height="12" rx="2.4" />
          <path d="M2 4l8 5.2L18 4" />
          <circle
            cx="16.2"
            cy="11.8"
            r="1.4"
            fill="currentColor"
            stroke="none"
            style={{
              transformOrigin: "16.2px 11.8px",
              animation: "magic-pulse-dot 1.8s ease-in-out infinite",
            }}
          />
        </svg>
      </div>
    </div>
  );
}
