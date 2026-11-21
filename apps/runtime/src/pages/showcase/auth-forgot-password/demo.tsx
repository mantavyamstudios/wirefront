// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: wires the view to a simulated backend inside devl.dev's frame.
// Not shipped by the registry; builders wire ForgotPassword to their own backend.
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { ForgotPassword } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function demoSend() {
  await wait(900);
}

export function AuthForgotPasswordShowcasePage() {
  return (
    <DevlFrame>
      <ForgotPassword
        defaultEmail={fixtures.defaultEmail}
        expiresInMinutes={fixtures.expiresInMinutes}
        onSend={demoSend}
        signInHref="#sign-in"
      />
    </DevlFrame>
  );
}
