// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import { CheckIcon } from "lucide-react";
import { useState } from "react";

import type { BillingPeriod, BillingPlan } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("billingPeriodPricing.<key>"). */
export const BILLING_PERIOD_PRICING_MESSAGES = {
  eyebrow: "Pricing",
  title: "Pick a plan, switch any time.",
  billing: "Billing period",
  monthly: "Monthly",
  yearly: "Yearly",
  save: "save {pct}%",
  recommended: "Recommended",
  forever: "forever",
  perSeatMonth: "/seat / month",
  was: "Was",
  monthlyPrice: "monthly price",
  billedYearly: "billed yearly",
  getStarted: "Get started",
  choose: "Choose plan",
};

export interface BillingPeriodPricingProps {
  plans: BillingPlan[];
  /** Called with the plan and the billing period chosen. */
  onChoose: (plan: BillingPlan, billing: BillingPeriod) => void;
  defaultBilling?: BillingPeriod;
  className?: string;
}

function BillingPeriodPricingScreen({ plans, onChoose, defaultBilling = "yearly", className }: BillingPeriodPricingProps) {
  const t = useMessages("billingPeriodPricing", BILLING_PERIOD_PRICING_MESSAGES);
  const format = useFormat();
  const [billing, setBilling] = useState(defaultBilling);
  // The best yearly saving across paid plans, for the toggle's tag.
  const savePct = Math.max(0, ...plans.filter((p) => p.monthly > 0).map((p) => Math.round((1 - p.yearly / p.monthly) * 100)));

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="text-center">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
          <h1 className="mt-2 text-balance font-heading text-3xl tracking-tight sm:text-4xl">{t.title}</h1>

          <RadioGroup
            aria-label={t.billing}
            className="mt-8 inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 p-1 font-mono text-xs uppercase tracking-[0.15em] sm:gap-3 sm:tracking-[0.2em]"
            onValueChange={(v) => setBilling(v as BillingPeriod)}
            value={billing}
          >
            {(["monthly", "yearly"] as const).map((b) => (
              <Radio.Root
                className="group relative min-h-9 cursor-pointer rounded-full px-4 py-1.5 text-muted-foreground uppercase outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground data-checked:text-background pointer-coarse:min-h-10"
                key={b}
                value={b}
              >
                {t[b]}
                {b === "yearly" && savePct > 0 ? (
                  <span className="ms-2 rounded bg-category-2/20 px-1.5 py-0.5 font-mono text-[11px] text-category-2-foreground normal-case tracking-normal group-data-checked:bg-background/15 group-data-checked:text-background">
                    {interpolate(t.save, { pct: savePct })}
                  </span>
                ) : null}
              </Radio.Root>
            ))}
          </RadioGroup>
        </div>

        {/* 1 column → 2 at md (recommended first, the third spans) → 3 at lg. */}
        <ul className="mt-10 grid grid-cols-1 gap-x-3 gap-y-6 sm:mt-12 md:grid-cols-2 lg:grid-cols-3 md:max-lg:*:last:col-span-2">
          {plans.map((p) => {
            const price = billing === "yearly" ? p.yearly : p.monthly;
            const money = (n: number) => format.money(n, p.currency, { maximumFractionDigits: 0 });
            return (
              <li
                className={cn(
                  "relative flex flex-col rounded-2xl border p-5 sm:p-6",
                  p.recommended ? "border-foreground bg-foreground/4 shadow-lg max-lg:order-first" : "border-border/60 bg-background/40",
                )}
                key={p.id}
              >
                {p.recommended ? (
                  <div className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center rounded-full bg-foreground px-2.5 py-1 font-mono text-[10px] text-background uppercase tracking-[0.3em]">
                    {t.recommended}
                  </div>
                ) : null}
                <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{p.name}</h2>
                <div aria-live="polite" className="mt-2 flex items-baseline gap-1">
                  <span className="font-heading text-4xl tracking-tight">{money(price)}</span>
                  <span className="text-muted-foreground text-xs">{price === 0 ? t.forever : t.perSeatMonth}</span>
                </div>
                {billing === "yearly" && price > 0 && p.monthly > price ? (
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                    {t.was}{" "}
                    <s>
                      <span className="sr-only">{t.monthlyPrice} </span>
                      {money(p.monthly)}
                    </s>{" "}
                    · {t.billedYearly}
                  </div>
                ) : null}
                <p className="mt-2 text-muted-foreground text-sm">{p.blurb}</p>
                <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                  {p.features.map((f) => (
                    <li className="flex items-start gap-2 text-sm" key={f}>
                      <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-category-2-foreground" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6" onClick={() => onChoose(p, billing)} size="lg" type="button" variant={p.recommended ? "default" : "outline"}>
                  {p.monthly === 0 ? t.getStarted : t.choose}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function BillingPeriodPricing(props: BillingPeriodPricingProps) {
  return (
    <ScreenBoundary name="BillingPeriodPricing">
      <BillingPeriodPricingScreen {...props} />
    </ScreenBoundary>
  );
}
