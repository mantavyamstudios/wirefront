// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the empty state in sample page chrome. Not shipped by the registry.
import * as fixtures from "./fixtures";
import { NoTeam } from "./view";

export function EmptyNoTeamShowcasePage() {
  return <NoTeam inviteUrl={fixtures.getInviteLink.url} onInviteByEmail={() => {}} settingsHref="#settings" userName={fixtures.userName} />;
}
