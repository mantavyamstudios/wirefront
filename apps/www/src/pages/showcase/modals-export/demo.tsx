// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend, with the dialog open.
// Not shipped by the registry; builders wire ExportDialog to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import * as fixtures from "./fixtures";
import type { ExportInput } from "./schema";
import { ExportDialog } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

/** A rough size: about 38 KB a day per section, 420 KB for raw payloads, more as JSON. */
function estimate({ include, from, to, format }: ExportInput) {
  const days = (Date.parse(to) - Date.parse(from)) / 86_400_000;
  const kb = include.reduce((n, s) => n + (s === "raw" ? 420 : 38), 0) * days * (format === "json" ? 1.6 : 1);
  return include.length ? `~${(kb / 1024).toFixed(1)} MB` : undefined;
}

export function ModalsExportShowcasePage() {
  return (
    <WirefrontProvider now={demoNow}>
      <ExportDialog defaultOpen estimateSize={estimate} onExport={() => wait(900)} sections={fixtures.sections} />
    </WirefrontProvider>
  );
}
