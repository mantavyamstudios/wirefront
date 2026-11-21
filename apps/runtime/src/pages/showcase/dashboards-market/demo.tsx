// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire MarketsDashboard to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import type { ChartRange } from "./schema";
import { MarketsDashboard } from "./view";

export function DashboardsMarketShowcasePage() {
  const state = useShowcaseState();
  const [range, setRange] = useState<ChartRange>("1D");
  const [symbol, setSymbol] = useState("ACME");
  const overview = fixtures.overviewFor(symbol);
  return (
    <WirefrontProvider currency="USD" timeZone="America/New_York">
      <MarketsDashboard
        data={state === "loading" || state === "error" ? undefined : state === "empty" ? { ...overview, watchlist: [], headlines: [] } : overview}
        error="The market data feed didn’t respond. Check your connection and try again."
        onAddTicker={() => {}}
        onRangeChange={setRange}
        onRetry={() => {}}
        onSelectTicker={setSymbol}
        portfolioName={fixtures.portfolioName}
        range={range}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      />
    </WirefrontProvider>
  );
}
