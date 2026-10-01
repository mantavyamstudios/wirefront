import { Fragment, useState } from "react";
import { CheckIcon, MinusIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";

const PLANS = [
  { id: "starter", name: "Starter", price: "$0", cadence: "/mo" },
  { id: "pro", name: "Pro", price: "$24", cadence: "/seat/mo", highlight: true },
  { id: "team", name: "Team", price: "$48", cadence: "/seat/mo" },
  { id: "enterprise", name: "Enterprise", price: "Custom", cadence: "annual" },
];

interface Row {
  label: string;
  values: (string | boolean)[];
}

const SECTIONS: { title: string; rows: Row[] }[] = [
  {
    title: "Workspace",
    rows: [
      { label: "Projects", values: ["3", "Unlimited", "Unlimited", "Unlimited"] },
      { label: "Members", values: ["5", "25", "100", "Unlimited"] },
      { label: "API requests / mo", values: ["10k", "1M", "10M", "Custom"] },
      { label: "Storage", values: ["1 GB", "100 GB", "1 TB", "Custom"] },
    ],
  },
  {
    title: "Security",
    rows: [
      { label: "SSO via Google", values: [false, true, true, true] },
      { label: "SAML SSO", values: [false, false, true, true] },
      { label: "SCIM provisioning", values: [false, false, false, true] },
      { label: "Custom roles", values: [false, false, true, true] },
      { label: "Audit log retention", values: ["7 days", "30 days", "1 year", "Forever"] },
    ],
  },
  {
    title: "Support",
    rows: [
      { label: "Community", values: [true, true, true, true] },
      { label: "Email", values: [false, true, true, true] },
      { label: "Priority email + chat", values: [false, false, true, true] },
      { label: "Dedicated success manager", values: [false, false, false, true] },
    ],
  },
];

// Phones: pick one plan with the switcher and compare it against the feature
// names (two columns). md+: the full table in a horizontal scroller with a
// sticky feature column.
export function PricingComparisonTableShowcasePage() {
  const [plan, setPlan] = useState("pro");
  // Every plan column hides below md unless it's the picked one.
  const col = (id: string) => (id === plan ? "" : "max-md:hidden ");

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Compare plans
        </div>
        <h1 className="mt-1 font-heading text-2xl sm:text-3xl">Every feature, side by side.</h1>

        <div
          role="group"
          aria-label="Plan to compare"
          className="mt-6 grid grid-cols-4 gap-1 rounded-lg border border-border/60 p-1 md:hidden"
        >
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={plan === p.id}
              onClick={() => setPlan(p.id)}
              className="min-h-10 rounded-md px-1 text-muted-foreground text-xs hover:text-foreground aria-pressed:bg-foreground aria-pressed:text-background"
            >
              {p.name}
            </button>
          ))}
        </div>

        <div
          tabIndex={0}
          aria-label="Plan comparison"
          className="mt-4 overflow-x-auto overscroll-x-contain rounded-xl border border-border/60 md:mt-10"
        >
          <table className="w-full text-sm md:min-w-[720px]">
            <thead>
              <tr className="bg-foreground/[0.02]">
                <th
                  scope="col"
                  className="sticky left-0 z-10 w-[45%] bg-background px-4 py-4 text-left font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em] md:w-[28%]"
                >
                  Plan
                </th>
                {PLANS.map((p) => (
                  <th
                    key={p.id}
                    scope="col"
                    className={
                      col(p.id) +
                      "px-4 py-4 text-left " +
                      (p.highlight ? "bg-foreground/[0.06]" : "")
                    }
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-1">
                      <span className="font-heading text-xl">{p.price}</span>
                      <span className="text-muted-foreground text-xs">
                        {p.cadence}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map((section) => (
                <Fragment key={section.title}>
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={5}
                      className="border-border/50 border-y bg-foreground/[0.02] px-4 py-2 text-left font-mono text-[11px] text-muted-foreground uppercase tracking-[0.25em]"
                    >
                      {section.title}
                    </th>
                  </tr>
                  {section.rows.map((row, i) => (
                    <tr
                      key={row.label}
                      className={i < section.rows.length - 1 ? "border-border/30 border-b" : ""}
                    >
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-background px-4 py-3 text-left font-normal text-foreground/85"
                      >
                        {row.label}
                      </th>
                      {row.values.map((v, j) => (
                        <td
                          key={PLANS[j]!.id}
                          className={
                            col(PLANS[j]!.id) +
                            "px-4 py-3 " +
                            (PLANS[j]?.highlight ? "bg-foreground/[0.04]" : "")
                          }
                        >
                          {typeof v === "boolean" ? (
                            v ? (
                              <>
                                <CheckIcon aria-hidden className="size-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="sr-only">Included</span>
                              </>
                            ) : (
                              <>
                                <MinusIcon aria-hidden className="size-4 text-muted-foreground/40" />
                                <span className="sr-only">Not included</span>
                              </>
                            )
                          ) : (
                            <span className="font-mono text-foreground/85 text-sm">
                              {v}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
              <tr className="bg-foreground/[0.02]">
                <td className="sticky left-0 z-10 bg-background" />
                {PLANS.map((p) => (
                  <td key={p.id} className={col(p.id) + "px-4 py-4"}>
                    <Button
                      size="sm"
                      variant={p.highlight ? "default" : "outline"}
                      type="button"
                      className="max-md:w-full"
                    >
                      {p.id === "starter" ? "Get started" : p.id === "enterprise" ? "Talk to us" : "Choose"}
                      <span className="sr-only"> {p.name}</span>
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
