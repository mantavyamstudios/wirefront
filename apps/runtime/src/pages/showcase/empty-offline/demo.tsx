// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the empty state in sample page chrome. Not shipped by the registry.
import { Offline } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function EmptyOfflineShowcasePage() {
  return (
    <Offline
      onRetry={async () => {
        await wait(1200);
        throw new Error("Still offline");
      }}
    />
  );
}
