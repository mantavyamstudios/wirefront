// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the screen inside the settings shell with a simulated backend.
// Not shipped by the registry; builders wire ProfileSettings to their own backend.
import { SettingsShell } from "@wirefront/ui/settings-shell";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { DevlFrame } from "../_devl-frame";
import { settingsBack, settingsNav, settingsUser } from "../_settings-nav";
import * as fixtures from "./fixtures";
import { ProfileSettings } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

async function demoCheckUsername(username: string) {
  await wait(300);
  const available = !fixtures.takenUsernames.includes(username);
  return { available, suggestions: available ? [] : [`${username}-hq`, `hey-${username}`, `${username}-studio`] };
}

export function SettingsProfileSettingsShowcasePage() {
  return (
    <WirefrontProvider now={demoNow}>
      <DevlFrame>
        <SettingsShell activeId="profile" back={settingsBack} groups={settingsNav} user={settingsUser}>
          <ProfileSettings
            checkUsername={demoCheckUsername}
            domain={fixtures.domain}
            onSave={() => wait(800)}
            product={fixtures.product}
            profile={fixtures.getProfile}
            timeZones={fixtures.timeZones}
          />
        </SettingsShell>
      </DevlFrame>
    </WirefrontProvider>
  );
}
