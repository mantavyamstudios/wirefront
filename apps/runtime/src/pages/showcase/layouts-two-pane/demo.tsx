// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the mail screen over sample messages. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useMemo, useState } from "react";
import * as fixtures from "./fixtures";
import type { MailFilter } from "./schema";
import { MailTwoPane } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

export function LayoutsTwoPaneShowcasePage() {
  const [filter, setFilter] = useState<MailFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("3");
  const [detailOpen, setDetailOpen] = useState(false);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fixtures.messages
      .filter((m) => (filter === "unread" ? m.unread : filter === "mentions" ? m.id === "1" : true))
      .filter((m) => !q || `${m.from.name} ${m.subject} ${m.preview}`.toLowerCase().includes(q))
      .map((m) => (m.id === selectedId ? { ...m, body: fixtures.body(m) } : m));
  }, [filter, search, selectedId]);
  return (
    <WirefrontProvider now={demoNow}>
      <MailTwoPane
        detailOpen={detailOpen}
        filter={filter}
        messages={shown}
        onArchive={() => wait(400)}
        onBack={() => setDetailOpen(false)}
        onDelete={() => wait(400)}
        onFilterChange={setFilter}
        onForward={() => {}}
        onReply={() => wait(600)}
        onReplyAll={() => {}}
        onSearchChange={setSearch}
        onSelect={(id) => {
          setSelectedId(id);
          setDetailOpen(true);
        }}
        search={search}
        selectedId={selectedId}
        unread={fixtures.listMessages.unread}
      />
    </WirefrontProvider>
  );
}
