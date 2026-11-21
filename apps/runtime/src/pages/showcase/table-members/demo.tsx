// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to an in-memory backend and the previewed state.
// Not shipped by the registry; builders wire MembersTable to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail, ok } from "@wirefront/ui/wirefront/types";
import { useMemo, useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import type { AssignableRole, InviteInput, Member, MembersPage } from "./schema";
import { type MembersListQuery, MembersTable } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

/** What a backend's listMembers would do with the query. */
function runQuery(all: Member[], query: MembersListQuery): MembersPage {
  const search = query.search?.trim().toLowerCase();
  let items = all.filter(
    (m) =>
      (!search || m.name.toLowerCase().includes(search) || m.email.toLowerCase().includes(search)) &&
      (!query.filters?.role || m.role === query.filters.role),
  );
  if (query.sort) {
    const { id, direction } = query.sort;
    const key = (m: Member) => (id === "name" ? m.name : (m.lastActiveAt ?? ""));
    items = [...items].sort((a, b) => key(a).localeCompare(key(b)) * (direction === "asc" ? 1 : -1));
  }
  const start = (query.page - 1) * query.pageSize;
  return { items: items.slice(start, start + query.pageSize), total: items.length };
}

export function TableMembersShowcasePage() {
  const state = useShowcaseState();
  const [db, setDb] = useState(fixtures.members);
  const [query, setQuery] = useState<MembersListQuery>({ page: 1, pageSize: 20 });
  const page = useMemo(() => runQuery(db, query), [db, query]);

  const onInvite = async ({ email, role }: InviteInput) => {
    await wait(700);
    if (db.some((m) => m.email === email)) return fail(undefined, { email: "They’re already in this workspace." });
    const invited: Member = { ...fixtures.inviteMember, id: `mem_${email}`, name: email, email, role };
    setDb((rows) => [...rows, invited]);
    return ok(invited);
  };
  const onRoleChange = async ({ id, role }: { id: string; role: AssignableRole }) => {
    await wait(600);
    setDb((rows) => rows.map((m) => (m.id === id ? { ...m, role } : m)));
  };
  const onRemove = async (id: string) => {
    await wait(600);
    setDb((rows) => rows.filter((m) => m.id !== id));
  };
  const onTransferOwnership = async (id: string) => {
    await wait(600);
    setDb((rows) => rows.map((m) => (m.id === id ? { ...m, role: "owner" } : m.role === "owner" ? { ...m, role: "admin" } : m)));
  };

  const empty = state === "empty";
  return (
    <WirefrontProvider now={demoNow}>
      <MembersTable
        error="The members service didn’t respond. Check your connection and try again."
        members={empty ? [] : page.items}
        onInvite={onInvite}
        onQueryChange={setQuery}
        onRemove={onRemove}
        onRetry={() => {}}
        onRoleChange={onRoleChange}
        onTransferOwnership={onTransferOwnership}
        query={query}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
        total={empty ? 0 : page.total}
      />
    </WirefrontProvider>
  );
}
