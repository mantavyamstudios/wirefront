// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the chat workspace over sample channels and messages. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useState } from "react";
import * as fixtures from "./fixtures";
import { ChatWorkspace } from "./view";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

export function LayoutsThreePaneShowcasePage() {
  const [workspace, setWorkspace] = useState("acme");
  const [active, setActive] = useState("design");
  const [messages, setMessages] = useState(fixtures.listMessages);
  return (
    <WirefrontProvider now={demoNow} timeZone="UTC">
      <ChatWorkspace
        activeId={active}
        channels={fixtures.channels}
        currentWorkspaceId={workspace}
        directs={fixtures.directs}
        memberCount={16}
        messages={active === "design" ? messages : []}
        onAddWorkspace={() => {}}
        onChannelSettings={() => {}}
        onOpenThread={() => {}}
        onSelect={setActive}
        onSend={async ({ body }) => {
          await wait(300);
          setMessages((list) => [
            ...list,
            {
              id: `local-${list.length}`,
              author: { name: "You", color: 6 },
              at: fixtures.now,
              body,
            },
          ]);
        }}
        onShowMembers={() => {}}
        onSwitchWorkspace={setWorkspace}
        workspaces={fixtures.workspaces}
      />
    </WirefrontProvider>
  );
}
