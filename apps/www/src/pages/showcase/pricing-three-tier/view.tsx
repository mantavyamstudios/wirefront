// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { CheckIcon, SparklesIcon } from "lucide-react";

import type { Plan } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("pricing.<key>"). */
export const PRICING_MESSAGES = {
  eyebrow: "Pricing",
  title: "Pay for what your team needs.",
  subtitle: "Three plans, no surprises. Switch up or down at any time — we pro-rate the difference.",
  custom: "Custom",
  forever: "forever",
  month: "/month",
  year: "/year",
  seatMonth: "/seat/month",
  seatYear: "/seat/year",
  annual: "annual",
  currentPlan: "Current plan",
  footnote: "All prices in {currency} · cancel any time",
};

export interface PricingProps {
  plans: Plan[];
  /** Start checkout (or contact sales) for a plan (receives its id). Usually redirects. */
  onChoosePlan: Action<string>;
  /** The plan the viewer is on, if signed in. Its button reads "Current plan" and is disabled. */
  currentPlanId?: string;
  className?: string;
}

function PricingScreen({ plans, onChoosePlan, currentPlanId, className }: PricingProps) {
  const t = useMessages("pricing", PRICING_MESSAGES);
  const format = useFormat();
  const choose = useAction(onChoosePlan);

  const price = (p: Plan) =>
    p.price ? format.money(p.price.amount, p.price.currency, { maximumFractionDigits: p.price.amount % 1 ? 2 : 0 }) : t.custom;
  const cadence = (p: Plan) => {
    if (!p.price) return t.annual;
    if (p.interval === "forever") return t.forever;
    if (p.perSeat) return p.interval === "month" ? t.seatMonth : t.seatYear;
    return p.interval === "month" ? t.month : t.year;
  };
  const currency = plans.find((p) => p.price)?.price?.currency;

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="text-center">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
          <h1 className="mt-2 text-balance font-heading text-3xl tracking-tight sm:text-4xl md:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-balance text-muted-foreground text-sm">{t.subtitle}</p>
        </div>

        {/* 1 column → 2 at md (featured plan first, the third spans) → 3 at lg. */}
        <div className="mt-10 grid grid-cols-1 gap-x-3 gap-y-6 sm:mt-12 md:grid-cols-2 md:max-lg:[&>:last-child]:col-span-2 lg:grid-cols-3 lg:items-stretch">
          {plans.map((p) => {
            const current = p.id === currentPlanId;
            const pending = choose.isPending(p.id);
            return (
              <div
                className={cn(
                  "relative flex flex-col rounded-2xl border p-5 sm:p-6",
                  p.featured ? "border-foreground bg-foreground/[0.04] shadow-lg max-lg:order-first lg:scale-[1.02]" : "border-border/60 bg-background/40",
                )}
                key={p.id}
              >
                {p.badge ? (
                  <div className="-translate-x-1/2 -top-3 absolute left-1/2 inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 font-mono text-[10px] text-background uppercase tracking-[0.3em]">
                    <SparklesIcon className="size-3" />
                    {p.badge}
                  </div>
                ) : null}
                <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{p.name}</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-heading text-4xl">{price(p)}</span>
                  <span className="text-muted-foreground text-xs">{cadence(p)}</span>
                </div>
                <p className="mt-2 text-muted-foreground text-sm">{p.blurb}</p>

                <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                  {p.features.map((f) => (
                    <li className="flex items-start gap-2 text-sm" key={f}>
                      <CheckIcon aria-hidden className={cn("mt-0.5 size-4 shrink-0", p.featured ? "text-foreground" : "text-emerald-700 dark:text-emerald-400")} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  aria-busy={pending}
                  className="mt-6"
                  disabled={current || choose.isPending()}
                  onClick={() => void choose.run(p.id, p.id)}
                  size="lg"
                  type="button"
                  variant={p.featured ? "default" : "outline"}
                >
                  {pending ? <Spinner data-icon="inline-start" /> : null}
                  {current ? t.currentPlan : p.cta}
                </Button>
              </div>
            );
          })}
        </div>

        {choose.error ? (
          <p className="mt-6 text-center text-destructive-foreground text-sm" role="alert">
            {choose.error}
          </p>
        ) : null}

        {currency ? (
          <p className="mt-10 text-center font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
            {interpolate(t.footnote, { currency })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function Pricing(props: PricingProps) {
  return (
    <ScreenBoundary name="Pricing">
      <PricingScreen {...props} />
    </ScreenBoundary>
  );
}
