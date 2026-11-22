// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the card with sample data. Not shipped by the registry.
import * as fixtures from "./fixtures";
import { ProfileCard } from "./view";

export function CardProfileShowcasePage() {
  return (
    <ProfileCard
      onMessage={() => {}}
      person={fixtures.getProfileSummary}
      profileHref="#profile"
    />
  );
}
