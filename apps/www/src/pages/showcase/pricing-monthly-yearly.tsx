import { useState } from "react";
import { CheckIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";

interface Plan {
  id: string;
  name: string;
  monthly: number;
  yearly: number;
  blurb: string;
  features: string[];
  primary?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthly: 0,
    yearly: 0,
    blurb: "For solo work.",
    features: ["3 projects", "5 collaborators", "Community support"],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 24,
    yearly: 19,
    blurb: "For growing teams.",
    primary: true,
    features: [
      "Unlimited projects",
      "1M API requests",
      "30-day audit log",
      "Priority support",
    ],
  },
  {
    id: "team",
    name: "Team",
    monthly: 48,
    yearly: 39,
    blurb: "For larger orgs.",
    features: [
      "Everything in Pro",
      "10M API requests",
      "1-year audit log",
      "Custom roles",
      "SSO + SCIM",
    ],
  },
];

export function PricingMonthlyYearlyShowcasePage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="text-center">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            Pricing
          </div>
          <h1 className="mt-2 text-balance font-heading text-3xl tracking-tight sm:text-4xl">
            Pick a plan, switch any time.
          </h1>

          <div
            role="radiogroup"
            aria-label="Billing period"
            className="mt-8 inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 p-1 font-mono text-xs uppercase tracking-[0.15em] sm:gap-3 sm:tracking-[0.2em]"
          >
            <button
              type="button"
              role="radio"
              aria-checked={!annual}
              onClick={() => setAnnual(false)}
              className={`relative min-h-9 rounded-full px-4 py-1.5 transition-colors pointer-coarse:min-h-10 ${
                !annual
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={annual}
              onClick={() => setAnnual(true)}
              className={`relative min-h-9 rounded-full px-4 py-1.5 transition-colors pointer-coarse:min-h-10 ${
                annual
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="ml-2 rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[11px] text-emerald-700 normal-case tracking-normal dark:text-emerald-300">
                save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 1 column → 2 at md (recommended first, the third spans) → 3 at lg. */}
        <div className="mt-10 grid grid-cols-1 gap-x-3 gap-y-6 sm:mt-12 md:grid-cols-2 lg:grid-cols-3 md:max-lg:[&>:last-child]:col-span-2">
          {PLANS.map((p) => {
            const price = annual ? p.yearly : p.monthly;
            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border p-5 sm:p-6 ${
                  p.primary
                    ? "border-foreground bg-foreground/[0.04] shadow-lg max-lg:order-first"
                    : "border-border/60 bg-background/40"
                }`}
              >
                {p.primary ? (
                  <div className="-translate-x-1/2 absolute -top-3 left-1/2 inline-flex items-center rounded-full bg-foreground px-2.5 py-1 font-mono text-[10px] text-background uppercase tracking-[0.3em]">
                    Recommended
                  </div>
                ) : null}
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
                  {p.name}
                </div>
                <div aria-live="polite" className="mt-2 flex items-baseline gap-1">
                  <span className="font-heading text-4xl tracking-tight">
                    ${price}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {price === 0 ? "forever" : "/seat / month"}
                  </span>
                </div>
                {annual && price > 0 ? (
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                    Was{" "}
                    <s className="opacity-60">
                      <span className="sr-only">monthly price </span>${p.monthly}
                    </s>{" "}
                    · billed yearly
                  </div>
                ) : null}
                <p className="mt-2 text-muted-foreground text-sm">{p.blurb}</p>

                <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  type="button"
                  variant={p.primary ? "default" : "outline"}
                  className="mt-6"
                >
                  {p.id === "starter" ? "Get started" : "Choose plan"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
