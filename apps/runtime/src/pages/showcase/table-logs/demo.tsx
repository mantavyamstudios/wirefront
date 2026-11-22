// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the log view over a fixed set of lines (no live stream).
// Not shipped by the registry; builders wire LogsTable to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useMemo, useState } from "react";
import * as fixtures from "./fixtures";
import { LogsTable } from "./view";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** What a backend would do with a filter like "severity:error service:billing". */
function runFilter(filter: string) {
  const terms = filter.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return fixtures.entries.filter((e) =>
    terms.every((term) => {
      const [key, value] = term.includes(":")
        ? term.split(":")
        : [undefined, term];
      if (key === "severity") return e.severity === value;
      if (key === "service") return e.service === value;
      return e.message.toLowerCase().includes(term);
    })
  );
}

export function TableLogsShowcasePage() {
  const [filter, setFilter] = useState("");
  const [live, setLive] = useState(true);
  const entries = useMemo(() => runFilter(filter), [filter]);
  return (
    <WirefrontProvider timeZone="UTC">
      <LogsTable
        entries={entries}
        filter={filter}
        live={live}
        onFilterChange={setFilter}
        onLiveChange={setLive}
        onNotifyOncall={() => wait(600)}
        onRetryRequest={() => wait(800)}
        source="prod-eu-west-1"
        traceHref={(e) => `#trace-${e.traceId}`}
      />
    </WirefrontProvider>
  );
}
