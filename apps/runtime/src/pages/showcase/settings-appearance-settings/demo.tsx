// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the screen inside the settings shell and devl.dev's frame.
// Not shipped by the registry; builders wire ThemeSettings to their own backend.
import { SettingsShell } from "@wirefront/ui/settings-shell";
import { useShowcaseState } from "@/lib/showcase-state";
import { DevlFrame } from "../_devl-frame";
import { settingsBack, settingsNav, settingsUser } from "../_settings-nav";
import * as fixtures from "./fixtures";
import { ThemeSettings } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function SettingsAppearanceSettingsShowcasePage() {
  const state = useShowcaseState();
  return (
    <DevlFrame>
      <SettingsShell activeId="appearance" back={settingsBack} groups={settingsNav} user={settingsUser}>
        <ThemeSettings
          defaults={fixtures.factoryPrefs}
          error="Appearance settings didn’t load. Check your connection and try again."
          onRetry={() => {}}
          onSave={() => wait(450)}
          prefs={state === "loading" || state === "error" ? undefined : fixtures.getThemePrefs}
          previewTasks={fixtures.previewTasks}
          status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
          workspace={fixtures.workspace}
        />
      </SettingsShell>
    </DevlFrame>
  );
}
