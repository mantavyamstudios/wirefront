// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire AppearanceSettings to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { AppearanceSettings } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function SettingsAppearanceShowcasePage() {
  const state = useShowcaseState();
  return (
    <AppearanceSettings
      defaults={fixtures.getAppearance}
      error="Appearance settings didn’t load. Check your connection and try again."
      onRetry={() => {}}
      onSave={() => wait(300)}
      prefs={state === "loading" || state === "error" ? undefined : fixtures.getAppearance}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
    />
  );
}
