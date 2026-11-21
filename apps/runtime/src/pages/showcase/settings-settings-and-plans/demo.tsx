// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the screen inside the settings shell, whose links switch
// tabs here, with a simulated backend. Not shipped by the registry; builders
// give each tab a route and wire SettingsAndPlans to their own backend.
import { SettingsShell } from "@wirefront/ui/settings-shell";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import { type AnchorHTMLAttributes, createContext, useContext, useState } from "react";
import { DevlFrame } from "../_devl-frame";
import { settingsBack, settingsNav, settingsUser } from "../_settings-nav";
import * as fixtures from "./fixtures";
import type { CreateKeyInput, InviteInput, SettingsTab } from "./schema";
import { SettingsAndPlans } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);
const TAB_FOR: Record<string, SettingsTab> = { "#general": "workspace", "#members": "members", "#developer": "keys", "#billing": "billing" };
const NAV_FOR: Record<SettingsTab, string> = { workspace: "general", members: "members", keys: "developer", billing: "billing" };

// Lets the demo's links switch tabs instead of navigating.
const TabContext = createContext<(tab: SettingsTab) => void>(() => {});

function DemoLink({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const setTab = useContext(TabContext);
  return (
    <a
      {...props}
      href={href}
      onClick={(e) => {
        onClick?.(e);
        const next = TAB_FOR[href];
        if (next) {
          e.preventDefault();
          setTab(next);
        }
      }}
    />
  );
}

export function SettingsSettingsAndPlansShowcasePage() {
  const [tab, setTab] = useState<SettingsTab>("workspace");
  return (
    <TabContext.Provider value={setTab}>
    <WirefrontProvider link={DemoLink} now={demoNow}>      <DevlFrame>
        <SettingsShell activeId={NAV_FOR[tab]} back={settingsBack} groups={settingsNav} user={settingsUser}>
          <SettingsAndPlans
            data={fixtures.getSettings}
            domain={fixtures.domain}
            onCancelDeletion={() => wait(500)}
            onChangePlan={() => wait(700)}
            onChangeRole={() => wait(400)}
            onCreateKey={async (input: CreateKeyInput) => {
              await wait(600);
              return ok({ ...fixtures.createKey, key: { ...fixtures.createKey.key, ...input } });
            }}
            onInvite={async (input: InviteInput) => {
              await wait(600);
              return ok({ ...fixtures.invite, ...input, id: `m_${input.email}`, name: input.email });
            }}
            onRemoveMember={() => wait(500)}
            onResendInvite={() => wait(400)}
            onRetryPayment={() => wait(900)}
            onRevokeKey={() => wait(500)}
            onSavePreferences={() => wait(300)}
            onSaveWorkspace={() => wait(600)}
            onScheduleDeletion={async () => {
              await wait(600);
              return ok(fixtures.scheduleDeletion);
            }}
            portalHref="#billing-portal"
            tab={tab}
          />
        </SettingsShell>
      </DevlFrame>
    </WirefrontProvider>
    </TabContext.Provider>
  );
}
