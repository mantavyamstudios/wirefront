// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { PresencePerson } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const workspace = "Acme studios";
export const me: PresencePerson = { id: "mantavyam", name: "Mantavyam", presence: "online", activity: "Listening to Bonobo", activityKind: "music" };

export const listPresence: PresencePerson[] = [
  { id: "maya", name: "Maya Okafor", presence: "online", activity: "Audit log · main" },
  { id: "dani", name: "Dani Kim", presence: "online", activity: "Figma · design tokens v3" },
  me,
  { id: "riya", name: "Riya Patel", presence: "idle", activity: "idle 18m" },
  { id: "james", name: "James Lin", presence: "idle", activity: "idle 7m" },
  { id: "olive", name: "Olive Berg", presence: "dnd", activity: "in a call · ends 14:30", activityKind: "call" },
  { id: "alex", name: "Alex Tran", presence: "offline", activity: "out — Mon 28" },
  { id: "carlos", name: "Carlos Mendes", presence: "offline", activity: "off until 09:00 GMT" },
];
