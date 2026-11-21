// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the rail with demo destinations and a placeholder page.
// Not shipped by the registry; builders pass their own nav and render pages as children.
import { BellIcon, CompassIcon, HomeIcon, InboxIcon, LayersIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import * as fixtures from "./fixtures";
import { MiniRailShell, type RailItem } from "./view";

const items: RailItem[] = [
  { id: "home", label: "Home", href: "#home", icon: <HomeIcon /> },
  { id: "inbox", label: "Inbox", href: "#inbox", icon: <InboxIcon />, count: 4 },
  { id: "activity", label: "Activity", href: "#activity", icon: <BellIcon /> },
  { id: "projects", label: "Projects", href: "#projects", icon: <LayersIcon /> },
  { id: "people", label: "People", href: "#people", icon: <UsersIcon /> },
  { id: "discover", label: "Discover", href: "#discover", icon: <CompassIcon /> },
];

export function SidebarsMiniRailShowcasePage() {
  const [workspace, setWorkspace] = useState("acme");
  return (
    <MiniRailShell
      accountHref="#account"
      activeId="projects"
      currentWorkspaceId={workspace}
      items={items}
      onAddWorkspace={() => {}}
      onSwitchWorkspace={setWorkspace}
      settingsHref="#settings"
      user={fixtures.user}
      workspaces={fixtures.listWorkspaces}
    >
      <div className="flex min-h-[calc(100svh-3.5rem-4rem)] items-center justify-center px-6 text-muted-foreground md:min-h-svh">
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em]">Main pane</div>
          <p className="mt-1.5 text-sm">
            <span className="md:hidden">Primary destinations live in the bottom bar.</span>
            <span className="hidden md:inline">Mini rail — hover or focus for tooltips.</span>
          </p>
        </div>
      </div>
    </MiniRailShell>
  );
}
