// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend.
// Not shipped by the registry; builders wire MagicLinkSent to their own backend.
import * as fixtures from "./fixtures";
import { MagicLinkSent } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function demoResend() {
  await wait(700);
}

export function AuthMagicLinkSentShowcasePage() {
  return (
    <MagicLinkSent
      changeEmailHref="#sign-in"
      email={fixtures.email}
      expiresInMinutes={fixtures.expiresInMinutes}
      mailApp={fixtures.mailApp}
      onResend={demoResend}
    />
  );
}
