// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { ArrowRightIcon, CheckIcon } from "lucide-react";

import type { SinglePlan } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("singlePlan.<key>"). */
export const SINGLE_PLAN_MESSAGES = {
  eyebrow: "One plan. Everything in.",
  title: "Just one price.",
  description: "We don’t do tiers. Either it’s worth it, or it isn’t.",
  perUserMonth: "/ user / month",
  billing: "Billed monthly. Less when paid annually.",
  start: "Start your trial",
  trial: "{days} days free · no card needed",
  includes: "Includes",
  contactBefore: "Need more seats or compliance features?",
  contact: "Talk to us",
};

export interface SinglePlanPricingProps {
  plan: SinglePlan;
  /** Start the trial (e.g. go to sign-up). */
  onStart: () => void;
  /** Where "Talk to us" goes. Hidden when not given. */
  contactHref?: string;
  className?: string;
}

function SinglePlanPricingScreen({ plan, onStart, contactHref, className }: SinglePlanPricingProps) {
  const t = useMessages("singlePlan", SINGLE_PLAN_MESSAGES);
  const format = useFormat();

  return (
    <div className={cn("relative min-h-svh overflow-hidden bg-background text-foreground", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 70% at 50% 0%, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 70%)" }}
      />
      <div className="relative mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-2 font-heading text-4xl tracking-tight">{t.title}</h1>
        <p className="mt-2 text-balance text-center text-muted-foreground text-sm">{t.description}</p>

        <div className="mt-10 w-full overflow-hidden rounded-2xl border border-border/60 bg-background shadow-xl">
          <div className="relative px-5 py-6 sm:px-7 sm:py-7">
            <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{plan.name}</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-heading text-5xl tracking-tight">{format.money(plan.price, plan.currency, { maximumFractionDigits: 0 })}</span>
              <span className="text-muted-foreground text-sm">{t.perUserMonth}</span>
            </div>
            <p className="mt-2 text-muted-foreground text-sm">{t.billing}</p>
            <Button className="mt-6 w-full" onClick={onStart} size="lg" type="button">
              {t.start}
              <ArrowRightIcon className="rtl:rotate-180" />
            </Button>
            {plan.trialDays ? (
              <p className="mt-2 text-center font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{interpolate(t.trial, { days: plan.trialDays })}</p>
            ) : null}
          </div>
          <div className="border-border/60 border-t bg-foreground/[0.02] px-5 py-5 sm:px-7 sm:py-6">
            <h3 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.includes}</h3>
            <ul className="mt-3 grid grid-cols-1 gap-2.5">
              {plan.features.map((f) => (
                <li className="flex items-start gap-2 text-sm" key={f}>
                  <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-foreground" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {contactHref ? (
          <p className="mt-6 text-balance text-center text-muted-foreground text-xs">
            {t.contactBefore}{" "}
            <WirefrontLink className="text-foreground underline-offset-4 hover:underline" href={contactHref}>
              {t.contact}
            </WirefrontLink>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function SinglePlanPricing(props: SinglePlanPricingProps) {
  return (
    <ScreenBoundary name="SinglePlanPricing">
      <SinglePlanPricingScreen {...props} />
    </ScreenBoundary>
  );
}
