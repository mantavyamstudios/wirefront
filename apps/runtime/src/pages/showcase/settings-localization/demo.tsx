// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire LocalizationSettings to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { LocalizationSettings } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

export function SettingsLocalizationShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider locale="en-US" now={demoNow}>
      <LocalizationSettings
        currencies={fixtures.currencies}
        error="Localization settings didn’t load. Check your connection and try again."
        languages={fixtures.languages}
        onRetry={() => {}}
        onSave={() => wait(300)}
        prefs={state === "loading" || state === "error" ? undefined : fixtures.getLocalePrefs}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
        timeZones={fixtures.timeZones}
      />
    </WirefrontProvider>
  );
}
