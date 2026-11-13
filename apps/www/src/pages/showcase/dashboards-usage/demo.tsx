// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire UsageDashboard to their own billing.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { UsageDashboard } from "./view";

const demoNow = () => new Date(fixtures.now);

export function DashboardsUsageShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider now={demoNow}>
      <UsageDashboard
        error="The billing service didn’t respond. Check your connection and try again."
        invoiceHref="#invoice"
        manageHref="#billing"
        onRetry={() => {}}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
        upgrade={{ plan: "Enterprise", href: "#upgrade" }}
        usage={state === "ready" ? fixtures.getUsage : undefined}
      />
    </WirefrontProvider>
  );
}
