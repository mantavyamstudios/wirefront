// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Adapted from the Enterprise UI Playground's components/flows/flow-facts.tsx (MIT).
import type { ScreenDetail } from "@/lib/screens/data";
import { SITE_URL } from "@/lib/site";

const STATE_LABELS: Record<string, string> = {
  ready: "Ready",
  loading: "Loading",
  empty: "Empty",
  error: "Error",
  forbidden: "Forbidden",
};

/** Source facts for one screen, from the generated screens manifest. */
export function ScreenFacts({ detail }: { detail: ScreenDetail }) {
  const rows: [string, string][] = [
    ["Readiness", detail.readiness === "ready" ? "Ready to wire" : "Preview"],
    ["States", detail.states.length > 0 ? detail.states.map((s) => STATE_LABELS[s] ?? s).join(", ") : "Ready"],
    ["Source", detail.files.map((file) => `apps/runtime/src/pages/showcase/${file}`).join("\n")],
    ["Install", `npx shadcn@latest add ${SITE_URL}/r/${detail.registry}.json`],
  ];

  return (
    <section className="flex flex-col gap-3">
      <h2 id="screen-details">Screen details</h2>
      <dl className="border-border/60 divide-border/60 divide-y overflow-hidden rounded-xl border text-sm">
        {rows.map(([label, value]) => (
          <div className="grid grid-cols-[9rem_1fr] gap-4 px-4 py-2.5" key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-foreground/80 min-w-0 font-mono text-[13px] break-words whitespace-pre-line">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
