// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend.
// Not shipped by the registry; builders wire InviteTeammates to their own backend.
import { ok } from "@wirefront/ui/wirefront/types";
import * as fixtures from "./fixtures";
import type { SendInvitesInput } from "./schema";
import { InviteTeammates } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function demoSend(input: SendInvitesInput) {
  await wait(700);
  return ok({ sent: input.invitations.length });
}

export function FormsInviteTeammatesShowcasePage() {
  return (
    <InviteTeammates
      autoJoinDomain={fixtures.autoJoinDomain}
      defaultInvitees={fixtures.defaultInvitees}
      defaultMessage={fixtures.defaultMessage}
      expiresInDays={7}
      inviteLink={fixtures.inviteLink}
      manageAutoJoinHref="#auto-join"
      onSend={demoSend}
    />
  );
}
