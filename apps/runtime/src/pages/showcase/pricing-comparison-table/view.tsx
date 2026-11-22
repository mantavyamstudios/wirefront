// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { ScrollRegion } from "@wirefront/ui/wirefront/scroll-region";
import { useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import { CheckIcon, MinusIcon } from "lucide-react";
import { Fragment, useState } from "react";

import type { ComparedPlan, ComparisonSection } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("planComparison.<key>"). */
export const PLAN_COMPARISON_MESSAGES = {
  eyebrow: "Compare plans",
  title: "Every feature, side by side.",
  pickPlan: "Plan to compare",
  table: "Plan comparison",
  plan: "Plan",
  custom: "Custom",
  month: "/mo",
  "seat-month": "/seat/mo",
  "annual-contract": "annual",
  included: "Included",
  notIncluded: "Not included",
  start: "Get started",
  choose: "Choose",
  sales: "Talk to us",
};

export interface PlanComparisonProps {
  plans: ComparedPlan[];
  sections: ComparisonSection[];
  /** Called with the plan whose button was pressed. */
  onChoose: (plan: ComparedPlan) => void;
  /** The plan shown on phones before the user picks one. Defaults to the featured plan. */
  defaultPlanId?: string;
  className?: string;
}

// Phones: pick one plan with the switcher and compare it against the feature
// names (two columns). md+: the full table in a horizontal scroller with a
// sticky feature column.
function PlanComparisonScreen({
  plans,
  sections,
  onChoose,
  defaultPlanId,
  className,
}: PlanComparisonProps) {
  const t = useMessages("planComparison", PLAN_COMPARISON_MESSAGES);
  const format = useFormat();
  const [picked, setPicked] = useState(
    defaultPlanId ?? plans.find((p) => p.featured)?.id ?? plans[0]?.id
  );
  // Every plan column hides below md unless it's the picked one.
  const col = (id: string) => (id === picked ? "" : "max-md:hidden");

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          {t.eyebrow}
        </div>
        <h1 className="mt-1 font-heading text-2xl sm:text-3xl">{t.title}</h1>

        <RadioGroup
          aria-label={t.pickPlan}
          className="mt-6 grid gap-1 rounded-lg border border-border/60 p-1 md:hidden"
          onValueChange={(v) => setPicked(v as string)}
          style={{
            gridTemplateColumns: `repeat(${plans.length}, minmax(0, 1fr))`,
          }}
          value={picked}
        >
          {plans.map((p) => (
            <Radio.Root
              className="min-h-10 cursor-pointer rounded-md px-1 text-muted-foreground text-xs outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground data-checked:text-background"
              key={p.id}
              value={p.id}
            >
              {p.name}
            </Radio.Root>
          ))}
        </RadioGroup>

        <ScrollRegion
          aria-label={t.table}
          className="mt-4 rounded-xl border border-border/60 md:mt-10"
          orientation="horizontal"
        >
          <table className="w-full text-sm md:min-w-180">
            <thead>
              <tr className="bg-foreground/2">
                <th
                  className="sticky inset-s-0 z-10 w-[45%] bg-background px-4 py-4 text-start font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em] md:w-[28%]"
                  scope="col"
                >
                  {t.plan}
                </th>
                {plans.map((p) => (
                  <th
                    className={cn(
                      col(p.id),
                      "px-4 py-4 text-start",
                      p.featured && "bg-foreground/6"
                    )}
                    key={p.id}
                    scope="col"
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-1">
                      <span className="font-heading text-xl">
                        {p.price === null
                          ? t.custom
                          : format.money(p.price, p.currency, {
                              maximumFractionDigits: 0,
                            })}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {t[p.billing]}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <Fragment key={section.title}>
                  <tr>
                    <th
                      className="border-border/50 border-y bg-foreground/2 px-4 py-2 text-start font-mono text-[11px] text-muted-foreground uppercase tracking-[0.25em]"
                      colSpan={plans.length + 1}
                      scope="colgroup"
                    >
                      {section.title}
                    </th>
                  </tr>
                  {section.rows.map((row, i) => (
                    <tr
                      className={
                        i < section.rows.length - 1
                          ? "border-border/30 border-b"
                          : undefined
                      }
                      key={row.label}
                    >
                      <th
                        className="sticky inset-s-0 z-10 bg-background px-4 py-3 text-start font-normal text-foreground/85"
                        scope="row"
                      >
                        {row.label}
                      </th>
                      {plans.map((p) => {
                        const v = row.values[p.id] ?? false;
                        return (
                          <td
                            className={cn(
                              col(p.id),
                              "px-4 py-3",
                              p.featured && "bg-foreground/4"
                            )}
                            key={p.id}
                          >
                            {typeof v === "boolean" ? (
                              <>
                                {v ? (
                                  <CheckIcon
                                    aria-hidden
                                    className="size-4 text-category-2-foreground"
                                  />
                                ) : (
                                  <MinusIcon
                                    aria-hidden
                                    className="size-4 text-muted-foreground"
                                  />
                                )}
                                <span className="sr-only">
                                  {v ? t.included : t.notIncluded}
                                </span>
                              </>
                            ) : (
                              <span className="font-mono text-foreground/85 text-sm">
                                {v}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
              <tr className="bg-foreground/2">
                <td className="sticky inset-s-0 z-10 bg-background" />
                {plans.map((p) => (
                  <td className={cn(col(p.id), "px-4 py-4")} key={p.id}>
                    <Button
                      className="max-md:w-full"
                      onClick={() => onChoose(p)}
                      size="sm"
                      type="button"
                      variant={p.featured ? "default" : "outline"}
                    >
                      {t[p.action]} <span className="sr-only">{p.name}</span>
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </ScrollRegion>
      </div>
    </div>
  );
}

export function PlanComparison(props: PlanComparisonProps) {
  return (
    <ScreenBoundary name="PlanComparison">
      <PlanComparisonScreen {...props} />
    </ScreenBoundary>
  );
}
