// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: renders the screen inside devl.dev's sans-serif frame.
// Not shipped by the registry; builders get CheckoutDemo from ./commerce-checkout.
import { DevlFrame } from "./_devl-frame";
import { CheckoutDemo } from "./commerce-checkout";

export function CommerceCheckoutShowcasePage() {
  return (
    <DevlFrame>
      <CheckoutDemo />
    </DevlFrame>
  );
}
