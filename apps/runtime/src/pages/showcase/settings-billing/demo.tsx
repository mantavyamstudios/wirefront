// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire BillingSettings to their own billing.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { BillingSettings } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function SettingsBillingShowcasePage() {
  const state = useShowcaseState();
  return (
    <BillingSettings
      billing={state === "ready" ? fixtures.getBilling : undefined}
      comparePlansHref="#pricing"
      error="The billing service didn’t respond. Check your connection and try again."
      onCancelPlan={() => wait(900)}
      onExportInvoices={() => wait(800)}
      onRetry={() => {}}
      portalHref="#portal"
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      upgradeHref="#upgrade"
    />
  );
}
