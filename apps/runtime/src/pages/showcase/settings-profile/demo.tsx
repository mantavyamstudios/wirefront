// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire AccountProfileSettings to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { AccountProfileSettings } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function SettingsProfileShowcasePage() {
  const state = useShowcaseState();
  return (
    <AccountProfileSettings
      deleteAccountHref="#delete-account"
      error="Your profile didn’t load. Check your connection and try again."
      languages={fixtures.languages}
      onRetry={() => {}}
      onSave={() => wait(600)}
      onUploadPhoto={() => wait(800)}
      profile={state === "loading" || state === "error" ? undefined : fixtures.getAccountProfile}
      sessions={{ description: "3 devices · last active 2 minutes ago", href: "#sessions" }}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      timeZones={fixtures.timeZones}
      twoFactor={{ description: "Authenticator app · enabled", href: "#two-factor" }}
    />
  );
}
