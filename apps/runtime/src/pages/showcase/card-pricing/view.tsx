// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@wirefront/ui/card";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import { CheckIcon } from "lucide-react";

import type { PlanTier } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("planCards.<key>"). */
export const PLAN_CARDS_MESSAGES = {
  eyebrow: "Pricing",
  title: "Pick a plan that fits.",
  description: "Switch or cancel anytime. All plans include a 14-day trial.",
  featured: "Most popular",
  custom: "Custom",
  forever: "forever",
  "seat-month": "per seat / month",
  month: "per month",
  year: "per year",
  "annual-contract": "annual",
  trial: "Start free trial",
  sales: "Talk to sales",
};

export interface PlanCardsProps {
  plans: PlanTier[];
  /** Called with the plan whose button was pressed (start a trial or open a sales form). */
  onChoose: (plan: PlanTier) => void;
  className?: string;
}

function PlanCardsScreen({ plans, onChoose, className }: PlanCardsProps) {
  const t = useMessages("planCards", PLAN_CARDS_MESSAGES);
  const format = useFormat();

  return (
    <div className={cn("min-h-svh bg-background px-4 py-8 sm:px-6 sm:py-16", className)}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
          <h1 className="mt-2 font-heading text-3xl">{t.title}</h1>
          <p className="mt-2 text-muted-foreground text-sm">{t.description}</p>
        </header>

        {/* 1 → 2 → 3 columns; the featured plan leads until all three fit side by side. */}
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <li className={cn(plan.featured && "max-lg:order-first")} key={plan.id}>
              <Card className={cn("h-full", plan.featured && "relative border-foreground/40 shadow-md lg:scale-[1.01]")}>
                {plan.featured ? <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase">{t.featured}</Badge> : null}
                <CardHeader>
                  <CardTitle className="font-heading">
                    <h2>{plan.name}</h2>
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">{plan.blurb}</p>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <div className="font-heading text-3xl tracking-tight">{plan.price === null ? t.custom : format.money(plan.price, plan.currency, { maximumFractionDigits: 0 })}</div>
                    <div className="text-muted-foreground text-xs">{t[plan.billing]}</div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-0">
                  <ul className="flex flex-col gap-2 text-sm">
                    {plan.features.map((f) => (
                      <li className="flex items-start gap-2" key={f}>
                        <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-foreground/70" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="border-t">
                  <Button className="w-full" onClick={() => onChoose(plan)} variant={plan.featured ? "default" : "outline"}>
                    {t[plan.action]}
                  </Button>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PlanCards(props: PlanCardsProps) {
  return (
    <ScreenBoundary name="PlanCards">
      <PlanCardsScreen {...props} />
    </ScreenBoundary>
  );
}
