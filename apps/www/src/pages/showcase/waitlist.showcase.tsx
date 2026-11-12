// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: renders the screen with Wirefront's demo illustration.
// Not shipped by the registry; builders pass their own `illustration`.
import emptyRoomSrc from "@/assets/figures/empty-room.png";
import { Waitlist } from "./waitlist";

export function WaitlistShowcasePage() {
  return <Waitlist illustration={emptyRoomSrc} />;
}
