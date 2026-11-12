// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: renders the screen with Wirefront's demo illustration.
// Not shipped by the registry; builders pass their own `illustration`.
import dustyFieldSrc from "@/assets/figures/dusty-field.png";
import { EmptyInboxZero } from "./empty-inbox-zero";

export function EmptyInboxZeroShowcasePage() {
  return <EmptyInboxZero illustration={dustyFieldSrc} />;
}
