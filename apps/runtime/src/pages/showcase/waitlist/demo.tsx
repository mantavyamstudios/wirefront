// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the screen with Wirefront's demo illustration.
// Not shipped by the registry; builders pass their own `illustration`.
import emptyRoomSrc from "@/assets/figures/empty-room.png";
import { Waitlist } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function WaitlistShowcasePage() {
  return <Waitlist illustration={emptyRoomSrc} onJoin={() => wait(600)} />;
}
