// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ReaderDocument } from "./schema";

/** What the mocks return for `listDocuments`. Demo data for the showcase and tests. */
export const listDocuments: ReaderDocument[] = [
  { id: "scratchpads", title: "On building scratchpads", href: "#scratchpads" },
  { id: "spacing", title: "Notes on spacing", href: "#spacing" },
  { id: "tokens", title: "Color tokens 101", href: "#tokens" },
  { id: "rhythm", title: "Reading rhythm", href: "#rhythm" },
  { id: "focus", title: "Why focus modes matter", href: "#focus" },
];

export const toc = [
  { id: "intro", label: "Introduction" },
  { id: "loop", label: "The iteration loop" },
  { id: "scaffolds", label: "Scaffolds vs. polish" },
  { id: "quote", label: "A note on patience" },
  { id: "closing", label: "Closing thoughts" },
];

export const user = { name: "Sam Rivera" };
