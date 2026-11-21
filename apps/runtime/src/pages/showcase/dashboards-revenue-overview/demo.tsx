// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: wires the view to fixture data inside devl.dev's sans-serif frame.
// Not shipped by the registry; builders wire RevenueStory to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ChartSplineIcon, HouseIcon, PackageIcon, ShoppingBagIcon, UsersIcon } from "lucide-react";
import { useShowcaseState } from "@/lib/showcase-state";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { RevenueStory } from "./view";

const demoNow = () => new Date(fixtures.now);

const NAV = [
  { label: "Home", href: "#home", icon: <HouseIcon aria-hidden /> },
  { label: "Orders", href: "#orders", icon: <ShoppingBagIcon aria-hidden /> },
  { label: "Products", href: "#products", icon: <PackageIcon aria-hidden /> },
  { label: "Customers", href: "#customers", icon: <UsersIcon aria-hidden /> },
  { label: "Revenue", href: "#revenue", icon: <ChartSplineIcon aria-hidden />, current: true },
];

export function DashboardsRevenueOverviewShowcasePage() {
  const state = useShowcaseState();
  return (
    <DevlFrame>
      <WirefrontProvider currency="USD" locale="en-US" now={demoNow}>
        <RevenueStory
          data={state === "loading" || state === "error" ? undefined : state === "empty" ? { ...fixtures.getRevenueStory, moments: [] } : fixtures.getRevenueStory}
          error="The sales service didn’t respond. Check your connection and try again."
          nav={NAV}
          onRetry={() => {}}
          settingsHref="#settings"
          status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
          store={fixtures.store}
          updatedAt={fixtures.updatedAt}
          user={fixtures.user}
        />
      </WirefrontProvider>
    </DevlFrame>
  );
}
