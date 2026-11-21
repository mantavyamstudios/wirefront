// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the shell with demo navigation and an Inbox page inside it.
// Not shipped by the registry; builders pass their own nav and render their pages as children.
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { useFormat, WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { BellIcon, HashIcon, HomeIcon, InboxIcon, PlusIcon } from "lucide-react";
import * as fixtures from "./fixtures";
import { AppShell, type NavSection } from "./view";

const demoNow = () => new Date(fixtures.now);

const sections: NavSection[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "home", label: "Home", href: "#home", icon: <HomeIcon /> },
      { id: "inbox", label: "Inbox", href: "#inbox", icon: <InboxIcon />, count: fixtures.getShellContext.unread },
      { id: "activity", label: "Activity", href: "#activity", icon: <BellIcon /> },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    items: fixtures.projects.map((p) => ({ id: p.id, label: p.name, href: `#${p.id}`, color: p.color, count: p.open })),
  },
  {
    id: "teams",
    label: "Teams",
    items: fixtures.teams.map((team) => ({ id: team, label: team, href: `#${team}`, icon: <HashIcon /> })),
  },
];

function InboxPage() {
  const format = useFormat();
  return (
    <>
      <div className="font-mono text-muted-foreground text-xs">Home / Inbox</div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl tracking-tight">Inbox</h1>
        <Button size="sm">
          <PlusIcon />
          New
        </Button>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {fixtures.stats.map((s) => (
          <div className="rounded-xl border border-border bg-card p-4" key={s.label}>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{s.label}</div>
            <div className="mt-2 font-heading text-2xl">{s.value}</div>
            <div className="mt-1 text-muted-foreground text-xs">{s.note}</div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <h2 className="mb-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">Recent activity</h2>
        <div className="rounded-xl border border-border bg-card">
          <ul className="divide-y divide-border/60">
            {fixtures.activity.map((a) => (
              <li className="flex items-start gap-3 px-4 py-3 sm:items-center" key={a.id}>
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback>
                    {a.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-sm sm:flex sm:items-center sm:gap-3">
                  <p className="line-clamp-2 sm:line-clamp-1 sm:flex-1">
                    <span className="font-medium">{a.name}</span> <span className="text-muted-foreground">{a.action}</span>
                  </p>
                  <span className="mt-0.5 block shrink-0 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.12em] sm:mt-0 sm:tracking-[0.2em]">
                    {format.relative(a.at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export function LayoutsAppShellShowcasePage() {
  const { user, workspace, unread } = fixtures.getShellContext;
  return (
    <WirefrontProvider now={demoNow}>
      <AppShell
        accountHref="#account"
        activeId="inbox"
        notificationsHref="#notifications"
        onSearch={() => {}}
        onSwitchWorkspace={() => {}}
        sections={sections}
        unread={unread}
        user={user}
        workspace={workspace}
      >
        <InboxPage />
      </AppShell>
    </WirefrontProvider>
  );
}
