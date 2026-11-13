// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the dialog open, with sample shortcuts.
// Not shipped by the registry.
import * as fixtures from "./fixtures";
import { ShortcutsDialog } from "./view";

export function ModalsShortcutsShowcasePage() {
  return <ShortcutsDialog defaultOpen footerNote="v3.4" groups={fixtures.groups} />;
}
