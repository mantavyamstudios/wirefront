// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend, with the dialog open.
// Not shipped by the registry; builders wire ShareDialog to their own backend.
import * as fixtures from "./fixtures";
import { ShareDialog } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ModalsShareLinkShowcasePage() {
  return (
    <ShareDialog
      defaultOpen
      documentMeta={fixtures.documentMeta}
      documentName={fixtures.documentName}
      linkAccess={fixtures.listAccess.linkAccess}
      linkUrl={fixtures.listAccess.linkUrl}
      members={fixtures.listAccess.members}
      onInvite={() => wait(700)}
      onLinkAccessChange={() => wait(400)}
      onRemove={() => wait(400)}
      onRoleChange={() => wait(400)}
    />
  );
}
