// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button, buttonVariants } from "@wirefront/ui/button";
import { IllustratedAuthLayout } from "@wirefront/ui/illustrated-auth-layout";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useMessages,
  WirefrontLink,
} from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  MailIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("checkEmail.<key>"). */
export const CHECK_EMAIL_MESSAGES = {
  eyebrow: "Magic link sent",
  title: "Check your inbox.",
  sentTo: "We sent a sign-in link to",
  expires: "Click it to continue — the link expires in {minutes} minutes.",
  clickIt: "Click it to continue.",
  openMail: "Open mail app",
  resendIn: "Resend in {seconds}s",
  resend: "Resend link",
  sentAgain: "Sent again · {count}",
  differentEmail: "Use a different email",
  noEmail: "Didn’t get the email? Check spam, then",
  support: "contact support",
};

export interface CheckEmailProps {
  /** Where the link went. */
  email: string;
  /** Send the link again. Hidden without it. */
  onResend?: Action;
  /** Seconds before resending is allowed again. */
  resendAfter?: number;
  /** How long the link works. Hidden when not given. */
  expiresInMinutes?: number;
  /** Where "Use a different email" goes. Hidden when not given. */
  changeEmailHref?: string;
  /** Where "contact support" goes. Hidden when not given. */
  supportHref?: string;
  /** The left-hand illustration (any image URL). */
  illustration: string;
  brand?: ReactNode;
  caption?: { eyebrow?: string; text: string };
  /** Top-right controls, such as a theme toggle. */
  actions?: ReactNode;
}

function CheckEmailScreen({
  email,
  onResend,
  resendAfter = 30,
  expiresInMinutes,
  changeEmailHref,
  supportHref,
  illustration,
  brand,
  caption,
  actions,
}: CheckEmailProps) {
  const t = useMessages("checkEmail", CHECK_EMAIL_MESSAGES);
  const [left, setLeft] = useState(resendAfter);
  const [sent, setSent] = useState(0);
  const resend = useAction(onResend ?? (async () => {}), {
    onSuccess: () => {
      setSent((n) => n + 1);
      setLeft(resendAfter);
    },
  });

  useEffect(() => {
    if (left <= 0) return;
    const timer = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left]);

  return (
    <IllustratedAuthLayout
      actions={actions}
      brand={brand}
      caption={caption}
      illustration={illustration}
    >
      <div className="w-full max-w-lg">
        <div className="inline-flex size-11 items-center justify-center rounded-full bg-category-2/15 text-category-2-foreground">
          <CheckCircle2Icon aria-hidden className="size-5" />
        </div>
        <div className="mt-5 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em]">
          {t.eyebrow}
        </div>
        <h1 className="mt-2 font-heading text-3xl leading-tight">{t.title}</h1>
        <p className="mt-2 max-w-md text-muted-foreground text-sm leading-relaxed">
          {t.sentTo}{" "}
          <span className="font-medium text-foreground">{email}</span>.{" "}
          {expiresInMinutes
            ? interpolate(t.expires, { minutes: expiresInMinutes })
            : t.clickIt}
        </p>

        <div className="mt-7 flex flex-col gap-2">
          {/* On phones this opens the default mail app. */}
          <a className={buttonVariants({ size: "lg" })} href="mailto:">
            <MailIcon />
            {t.openMail}
          </a>
          {onResend ? (
            <Button
              aria-busy={resend.isPending()}
              disabled={left > 0 || resend.isPending()}
              onClick={() => void resend.run()}
              size="lg"
              type="button"
              variant="ghost"
            >
              {resend.isPending() ? <Spinner data-icon="inline-start" /> : null}
              {left > 0
                ? interpolate(t.resendIn, {
                    seconds: String(left).padStart(2, "0"),
                  })
                : t.resend}
            </Button>
          ) : null}
        </div>

        <div aria-live="polite">
          {resend.error ? (
            <p
              className="mt-3 text-destructive-foreground text-sm"
              role="alert"
            >
              {resend.error}
            </p>
          ) : sent > 0 ? (
            <div
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-category-2/10 px-2 py-1 font-mono text-[10px] text-category-2-foreground uppercase tracking-[0.25em]"
              role="status"
            >
              <CheckCircle2Icon aria-hidden className="size-3" />
              {interpolate(t.sentAgain, { count: sent })}
            </div>
          ) : null}
        </div>

        {changeEmailHref || supportHref ? (
          <div className="mt-8 border-border/60 border-t pt-5">
            {changeEmailHref ? (
              <WirefrontLink
                className="inline-flex min-h-8 items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground pointer-coarse:min-h-11"
                href={changeEmailHref}
              >
                <ArrowLeftIcon
                  aria-hidden
                  className="size-3.5 rtl:rotate-180"
                />
                {t.differentEmail}
              </WirefrontLink>
            ) : null}
            {supportHref ? (
              <p
                className={cn(
                  "text-muted-foreground text-xs leading-relaxed",
                  changeEmailHref && "mt-3"
                )}
              >
                {t.noEmail}{" "}
                <WirefrontLink
                  className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline"
                  href={supportHref}
                >
                  {t.support}
                  <ArrowRightIcon
                    aria-hidden
                    className="size-3 rtl:rotate-180"
                  />
                </WirefrontLink>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </IllustratedAuthLayout>
  );
}

export function CheckEmail(props: CheckEmailProps) {
  return (
    <ScreenBoundary name="CheckEmail">
      <CheckEmailScreen {...props} />
    </ScreenBoundary>
  );
}
