// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire AuditLog to their own backend.
import { useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { AuditLog } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function demoExport() {
  await wait(800);
}

export function TableAuditLogShowcasePage() {
  const state = useShowcaseState();
  const [filters, setFilters] = useState(fixtures.filters);
  const entries = state === "empty" ? [] : fixtures.entries;
  return (
    <AuditLog
      entries={entries}
      error="The audit service didn’t respond. Check your connection and try again."
      filters={filters}
      hasMore={state !== "empty"}
      onAddFilter={() => {}}
      onClearFilters={() => setFilters([])}
      onEditFilter={() => {}}
      onExport={demoExport}
      onLoadMore={async () => {
        await wait(700);
      }}
      onRemoveFilter={(id) => setFilters((all) => all.filter((f) => f.id !== id))}
      onRetry={() => {}}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      total={state === "empty" ? 0 : fixtures.listAuditEvents.total}
    />
  );
}
