// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the empty state in sample page chrome. Not shipped by the registry.
import { NotFound } from "./view";

export function Empty404ShowcasePage() {
  return <NotFound homeHref="#home" onBack={() => {}} />;
}
