// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the screen inside the settings shell and devl.dev's frame, saving to nowhere.
// Not shipped by the registry; builders wire NotificationSettings to their own backend.
import { SettingsShell } from "@wirefront/ui/settings-shell";
import { DevlFrame } from "../_devl-frame";
import { settingsBack, settingsNav, settingsUser } from "../_settings-nav";
import * as fixtures from "./fixtures";
import { NotificationSettings } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function SettingsNotificationSettingsShowcasePage() {
  return (
    <DevlFrame>
      <SettingsShell activeId="notifications" back={settingsBack} groups={settingsNav} user={settingsUser}>
        <NotificationSettings data={fixtures.getNotificationSettings} onSave={() => wait(500)} product={fixtures.product} />
      </SettingsShell>
    </DevlFrame>
  );
}
