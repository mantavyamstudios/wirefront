// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the app's commands plus fixture search results, with the palette open.
// Not shipped by the registry; builders pass their own commands and results.
import * as fixtures from "./fixtures";
import { CommandPalette } from "./view";

const [suggestions, ...rest] = fixtures.actions;
const groups = suggestions ? [suggestions, ...fixtures.searchCommands, ...rest] : fixtures.searchCommands;

export function ModalsCommandPaletteShowcasePage() {
  return <CommandPalette defaultOpen groups={groups} onSelect={() => {}} />;
}
