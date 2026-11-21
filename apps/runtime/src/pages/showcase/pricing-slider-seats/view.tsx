// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import { CheckIcon } from "lucide-react";
import { useId, useState } from "react";

import type { SeatPlan, SeatSelection } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("seatPricing.<key>"). */
export const SEAT_PRICING_MESSAGES = {
  eyebrow: "{plan} plan",
  title: "How big is your team?",
  perMonth: "/ month",
  billedYearly: "{total} billed annually · save {discount}%",
  billedMonthly: "Billed monthly",
  billing: "Billing period",
  monthly: "Monthly",
  yearly: "Yearly",
  seats: "Seats",
  perSeat: "× {price}",
  seatsValue: "{count} seats, {price} per month",
  seatsValueOne: "1 seat, {price} per month",
  orMore: "{count}+",
  continueOne: "Continue with 1 seat",
  continue: "Continue with {count} seats",
  trial: "{days}-day free trial · no card required",
};

export interface SeatPricingProps {
  plan: SeatPlan;
  /** Continue to checkout with the chosen seats and billing. */
  onContinue: (selection: SeatSelection) => void;
  defaultSeats?: number;
  defaultBilling?: SeatSelection["billing"];
  className?: string;
}

function SeatPricingScreen({ plan, onContinue, defaultSeats = 8, defaultBilling = "yearly", className }: SeatPricingProps) {
  const t = useMessages("seatPricing", SEAT_PRICING_MESSAGES);
  const format = useFormat();
  const id = useId();
  const [seats, setSeats] = useState(Math.min(Math.max(defaultSeats, plan.minSeats), plan.maxSeats));
  const [billing, setBilling] = useState(defaultBilling);
  const money = (n: number) => format.money(n, plan.currency, { maximumFractionDigits: 0 });
  const monthly = seats * plan.perSeat;
  const yearlyTotal = monthly * 12 * (1 - plan.annualDiscountPct / 100);
  const shown = billing === "yearly" ? Math.round(yearlyTotal / 12) : monthly;
  const span = plan.maxSeats - plan.minSeats;
  const ticks = [plan.minSeats, ...[0.2, 0.4, 0.6, 0.8].map((f) => Math.round(plan.minSeats + f * span)), plan.maxSeats];

  return (
    <div className={cn("flex min-h-svh items-center justify-center bg-background px-4 py-10 text-foreground sm:px-6", className)}>
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{interpolate(t.eyebrow, { plan: plan.name })}</div>
          <h1 className="mt-1 font-heading text-3xl">{t.title}</h1>
        </div>

        <div className="mt-8 rounded-2xl border border-border/60 bg-background/40 p-5 sm:mt-10 sm:p-8">
          {/* Price over the billing toggle on phones; side by side from sm. */}
          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <div aria-live="polite" className="flex items-baseline gap-1">
                <span className="font-heading text-4xl tracking-tight sm:text-5xl">{money(shown)}</span>
                <span className="text-muted-foreground text-sm">{t.perMonth}</span>
              </div>
              <p className={cn("mt-1 font-mono text-[10px] uppercase tracking-[0.25em]", billing === "yearly" ? "text-category-2-foreground" : "text-muted-foreground")}>
                {billing === "yearly" ? interpolate(t.billedYearly, { total: money(Math.round(yearlyTotal)), discount: plan.annualDiscountPct }) : t.billedMonthly}
              </p>
            </div>
            <RadioGroup
              aria-label={t.billing}
              className="inline-flex self-start rounded-full border border-border/60 bg-background/40 p-0.5 font-mono text-[11px] uppercase tracking-[0.2em] sm:self-auto"
              onValueChange={(v) => setBilling(v as SeatSelection["billing"])}
              value={billing}
            >
              {(["monthly", "yearly"] as const).map((b) => (
                <Radio.Root
                  className="min-h-8 cursor-pointer rounded-full px-3 py-1.5 text-muted-foreground uppercase outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground data-checked:text-background pointer-coarse:min-h-10"
                  key={b}
                  value={b}
                >
                  {t[b]}
                </Radio.Root>
              ))}
            </RadioGroup>
          </div>

          <div className="mt-10">
            <div className="flex items-baseline justify-between">
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]" htmlFor={`${id}-seats`}>
                {t.seats}
              </label>
              <div aria-hidden className="font-mono text-sm">
                <span className="font-heading text-2xl">{seats === plan.maxSeats ? interpolate(t.orMore, { count: seats }) : seats}</span>
                <span className="text-muted-foreground"> {interpolate(t.perSeat, { price: money(plan.perSeat) })}</span>
              </div>
            </div>
            <input
              aria-valuetext={interpolate(seats === 1 ? t.seatsValueOne : t.seatsValue, { count: seats, price: money(shown) })}
              // Taller input = bigger touch target for the native thumb.
              className="mt-3 h-6 w-full cursor-pointer accent-foreground pointer-coarse:h-10"
              id={`${id}-seats`}
              max={plan.maxSeats}
              min={plan.minSeats}
              onChange={(e) => setSeats(Number(e.target.value))}
              type="range"
              value={seats}
            />
            {/* Ticks sit at their real slider positions. */}
            <div aria-hidden className="relative mt-1 h-4 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.1em]">
              {ticks.map((v, i) => (
                <span
                  className={cn("absolute", i === 0 ? "start-0" : i === ticks.length - 1 ? "end-0" : "-translate-x-1/2 rtl:translate-x-1/2")}
                  key={v}
                  style={i > 0 && i < ticks.length - 1 ? { insetInlineStart: `${((v - plan.minSeats) / span) * 100}%` } : undefined}
                >
                  {v === plan.maxSeats ? interpolate(t.orMore, { count: v }) : v}
                </span>
              ))}
            </div>
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {plan.features.map((f) => (
              <li className="flex items-start gap-2 text-sm" key={f}>
                <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-category-2-foreground" />
                {f}
              </li>
            ))}
          </ul>

          <Button className="mt-8 w-full" onClick={() => onContinue({ seats, billing })} size="lg" type="button">
            {seats === 1 ? t.continueOne : interpolate(t.continue, { count: seats })}
          </Button>
          {plan.trialDays ? <p className="mt-2 text-center text-muted-foreground text-xs">{interpolate(t.trial, { days: plan.trialDays })}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function SeatPricing(props: SeatPricingProps) {
  return (
    <ScreenBoundary name="SeatPricing">
      <SeatPricingScreen {...props} />
    </ScreenBoundary>
  );
}
