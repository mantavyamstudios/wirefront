// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend.
// Not shipped by the registry; builders wire NotificationSettings to their own backend.
import * as fixtures from "./fixtures";
import { NotificationSettings } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function FormsNotificationsShowcasePage() {
  return (
    <NotificationSettings
      defaultPreferences={fixtures.getPreferences}
      onChange={() => wait(400)}
      onEditQuietHours={() => {}}
      quietHours={fixtures.quietHours}
      sections={fixtures.sections}
    />
  );
}
