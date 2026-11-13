// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the screen inside the settings shell with a simulated backend.
// Not shipped by the registry; builders wire TeamRoles to their own backend.
import { SettingsShell } from "@wirefront/ui/settings-shell";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import { DevlFrame } from "../_devl-frame";
import { settingsBack, settingsNav, settingsUser } from "../_settings-nav";
import * as fixtures from "./fixtures";
import type { InviteInput } from "./schema";
import { TeamRoles } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

async function demoInvite(input: InviteInput) {
  await wait(600);
  return ok({ ...fixtures.invite, ...input, id: `i_${input.email}` });
}

export function SettingsTeamRolesShowcasePage() {
  return (
    <WirefrontProvider now={demoNow}>
      <DevlFrame>
        <SettingsShell activeId="members" back={settingsBack} groups={settingsNav} user={settingsUser}>
          <TeamRoles
            data={fixtures.getTeam}
            onChangeRole={() => wait(400)}
            onInvite={demoInvite}
            onRemoveMember={() => wait(600)}
            onResendInvite={() => wait(500)}
            onRevokeInvite={() => wait(500)}
            onSaveRoles={() => wait(700)}
            product={fixtures.product}
          />
        </SettingsShell>
      </DevlFrame>
    </WirefrontProvider>
  );
}
