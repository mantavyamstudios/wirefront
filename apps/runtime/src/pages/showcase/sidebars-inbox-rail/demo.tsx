// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the rail over sample threads, with a placeholder conversation.
// Not shipped by the registry; builders render the conversation as children.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useState } from "react";
import * as fixtures from "./fixtures";
import type { InboxFilter } from "./schema";
import { InboxRail } from "./view";

const demoNow = () => new Date(fixtures.now);

export function SidebarsInboxRailShowcasePage() {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [selectedId, setSelectedId] = useState("3");
  const [detailOpen, setDetailOpen] = useState(false);
  const shown =
    filter === "unread"
      ? fixtures.threads.filter((t) => t.unread)
      : filter === "mentions"
        ? fixtures.threads.slice(0, 1)
        : fixtures.threads;
  const selected = fixtures.threads.find((t) => t.id === selectedId);
  return (
    <WirefrontProvider now={demoNow}>
      <InboxRail
        detailOpen={detailOpen}
        filter={filter}
        onArchiveRead={async () => {}}
        onBack={() => setDetailOpen(false)}
        onFilterChange={setFilter}
        onSearch={() => {}}
        onSelect={(id) => {
          setSelectedId(id);
          setDetailOpen(true);
        }}
        selectedId={selectedId}
        threads={shown}
        unread={fixtures.listThreads.unread}
      >
        <div className="flex flex-1 items-center justify-center px-6 text-center text-muted-foreground">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em]">
              Conversation pane
            </div>
            <p className="mt-1.5 text-sm">
              {selected ? `${selected.from.name} — ${selected.preview}` : null}
            </p>
          </div>
        </div>
      </InboxRail>
    </WirefrontProvider>
  );
}
