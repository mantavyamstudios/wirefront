// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend, with the dialog open.
// Not shipped by the registry; builders wire SendFeedback to their own backend.
import * as fixtures from "./fixtures";
import { SendFeedback } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ModalsFeedbackShowcasePage() {
  return <SendFeedback defaultOpen onSend={() => wait(800)} product={fixtures.product} />;
}
