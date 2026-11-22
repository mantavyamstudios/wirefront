// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the rail with demo navigation and a placeholder page.
// Not shipped by the registry; builders pass their own nav and render pages as children.
import {
  BellIcon,
  CompassIcon,
  HashIcon,
  HomeIcon,
  InboxIcon,
  LayersIcon,
  UsersIcon,
} from "lucide-react";
import * as fixtures from "./fixtures";
import { type RailNavSection, WorkspaceRailShell } from "./view";

const sections: RailNavSection[] = [
  {
    id: "main",
    items: [
      { id: "home", label: "Home", href: "#home", icon: <HomeIcon /> },
      {
        id: "inbox",
        label: "Inbox",
        href: "#inbox",
        icon: <InboxIcon />,
        count: 4,
        unread: true,
      },
      {
        id: "activity",
        label: "Activity",
        href: "#activity",
        icon: <BellIcon />,
      },
      {
        id: "projects",
        label: "Projects",
        href: "#projects",
        icon: <LayersIcon />,
      },
      { id: "people", label: "People", href: "#people", icon: <UsersIcon /> },
      {
        id: "discover",
        label: "Discover",
        href: "#discover",
        icon: <CompassIcon />,
      },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    items: fixtures.projects.map((p) => ({
      id: p.id,
      label: p.name,
      href: `#${p.id}`,
      color: p.color,
    })),
    action: { label: "New project", onClick: () => {} },
  },
  {
    id: "teams",
    label: "Teams",
    items: fixtures.teams.map((team) => ({
      id: team.id,
      label: team.name,
      href: `#${team.id}`,
      icon: <HashIcon />,
      count: team.members,
    })),
  },
];

export function SidebarsWorkspaceRailShowcasePage() {
  return (
    <WorkspaceRailShell
      activeId="q3"
      context={fixtures.getRailContext}
      onSearch={() => {}}
      onSwitchWorkspace={() => {}}
      sections={sections}
      settingsHref="#settings"
    >
      <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-6 text-muted-foreground md:min-h-svh md:px-10">
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em]">
            Main pane
          </div>
          <p className="mt-1.5 text-sm">Sidebar showcase — content omitted.</p>
        </div>
      </div>
    </WorkspaceRailShell>
  );
}
