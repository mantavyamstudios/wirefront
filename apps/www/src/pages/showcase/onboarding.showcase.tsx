// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: renders the screen with Wirefront's demo illustration.
// Not shipped by the registry; builders pass their own `illustration`.
import clustersSrc from "@/assets/figures/clusters.png";
import { ThemeToggle } from "@wirefront/ui/theme-toggle";
import { Onboarding } from "./onboarding";

export function OnboardingShowcasePage() {
  return <Onboarding actions={<ThemeToggle />} illustration={clustersSrc} />;
}
