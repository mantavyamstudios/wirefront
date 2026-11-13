// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the screen inside the settings shell with an in-memory backend
// and the previewed state. Not shipped by the registry; builders wire AdminUsers
// to their own backend.
import { SettingsShell } from "@wirefront/ui/settings-shell";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail } from "@wirefront/ui/wirefront/types";
import { useMemo, useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import { DevlFrame } from "../_devl-frame";
import { settingsBack, settingsNav, settingsUser } from "../_settings-nav";
import * as fixtures from "./fixtures";
import type { AdminUser, AdminUserDetails, AdminUsersPage, InviteMembersInput, RoleChangeInput } from "./schema";
import { AdminUsers, type AdminUsersListQuery } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

/** What a backend's listUsers would do with the query. */
function runQuery(all: AdminUser[], query: AdminUsersListQuery, seats: number): AdminUsersPage {
  const search = query.search?.trim().toLowerCase();
  const f = query.filters ?? {};
  let items = all.filter(
    (u) =>
      (!f.status || u.status === f.status) &&
      (!f.role?.length || f.role.includes(u.role)) &&
      (f.twoFactor !== "off" || !u.twoFactor) &&
      (!search || [u.name, u.email, ...u.teams].some((v) => v.toLowerCase().includes(search))),
  );
  const { id = "name", direction = "asc" } = query.sort ?? {};
  const key = (u: AdminUser) => (id === "name" ? (u.name || u.email).toLowerCase() : (u.lastActiveAt ?? ""));
  items = [...items].sort((a, b) => key(a).localeCompare(key(b)) * (direction === "asc" ? 1 : -1));
  const start = (query.page - 1) * query.pageSize;
  const active = all.filter((u) => u.status === "active");
  return {
    items: items.slice(start, start + query.pageSize),
    total: items.length,
    summary: {
      seats,
      seatsUsed: all.filter((u) => u.status !== "suspended" && u.role !== "viewer").length,
      counts: { all: all.length, active: active.length, invited: all.filter((u) => u.status === "invited").length, suspended: all.filter((u) => u.status === "suspended").length },
      activeWithoutTwoFactor: active.filter((u) => !u.twoFactor).length,
    },
  };
}

/** Owen has a full history; everyone else gets one built from their row. */
function demoDetails(user: AdminUser): AdminUserDetails {
  if (user.id === "u2") return fixtures.getUserDetails;
  if (user.status === "invited") return { devices: [], activity: [{ id: "a1", kind: "invite", text: "Invite sent by Maya Lindgren", at: user.joinedAt }] };
  return {
    devices: user.lastActiveAt ? [{ id: "d1", name: "MacBook Pro · Chrome", kind: "desktop", location: user.location, lastActiveAt: user.lastActiveAt, current: true }] : [],
    activity: [
      ...(user.lastActiveAt ? [{ id: "a1", kind: "signin" as const, text: `Signed in from ${user.location ?? "an unknown location"}`, at: user.lastActiveAt }] : []),
      { id: "a2", kind: "join" as const, text: "Joined from an invite by Maya Lindgren", at: user.joinedAt },
    ],
  };
}

export function TableAdminUsersShowcasePage() {
  const state = useShowcaseState();
  const [db, setDb] = useState(fixtures.users);
  const [query, setQuery] = useState<AdminUsersListQuery>({ page: 1, pageSize: 20, sort: { id: "name", direction: "asc" } });
  const page = useMemo(() => runQuery(db, query, fixtures.seats), [db, query]);
  const update = (ids: string[], patch: Partial<AdminUser>) => setDb((rows) => rows.map((u) => (ids.includes(u.id) ? { ...u, ...patch } : u)));

  const onInvite = async ({ emails, role }: InviteMembersInput) => {
    await wait(700);
    const taken = emails.filter((e) => db.some((u) => u.email === e));
    if (taken.length) return fail(`${taken.join(", ")} ${taken.length === 1 ? "is" : "are"} already a member or invited.`);
    const at = new Date(fixtures.now).toISOString();
    setDb((rows) => [
      ...emails.map((email): AdminUser => ({ id: `inv-${email}`, name: "", email, role, status: "invited", twoFactor: false, teams: [], lastActiveAt: null, joinedAt: at })),
      ...rows,
    ]);
  };
  const onRoleChange = async ({ ids, role }: RoleChangeInput) => {
    await wait(500);
    update(ids, { role });
  };
  const onSuspend = async (ids: string[]) => {
    await wait(500);
    update(ids, { status: "suspended" });
  };
  const onReactivate = async (ids: string[]) => {
    await wait(500);
    update(ids, { status: "active" });
  };
  const onRemove = async (ids: string[]) => {
    await wait(500);
    setDb((rows) => rows.filter((u) => !ids.includes(u.id)));
  };
  const loadDetails = async (id: string) => {
    await wait(300);
    const user = db.find((u) => u.id === id);
    if (!user) throw new Error("Not found");
    return demoDetails(user);
  };

  const empty = state === "empty";
  return (
    <WirefrontProvider now={demoNow}>
      <DevlFrame>
        <SettingsShell activeId="members" back={settingsBack} groups={settingsNav} user={settingsUser}>
          <AdminUsers
            currentUserId={fixtures.currentUserId}
            error="The members service didn’t respond. Check your connection and try again."
            loadDetails={loadDetails}
            onInvite={onInvite}
            onQueryChange={setQuery}
            onReactivate={onReactivate}
            onRemove={onRemove}
            onResendInvite={() => wait(500)}
            onRetry={() => {}}
            onRoleChange={onRoleChange}
            onSuspend={onSuspend}
            orgName={fixtures.orgName}
            query={query}
            status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
            summary={page.summary}
            total={empty ? 0 : page.total}
            users={empty ? [] : page.items}
          />
        </SettingsShell>
      </DevlFrame>
    </WirefrontProvider>
  );
}
