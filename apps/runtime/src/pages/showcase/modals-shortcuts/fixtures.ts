// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ShortcutGroup } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const groups: ShortcutGroup[] = [
  {
    name: "General",
    shortcuts: [
      { keys: ["⌘", "K"], label: "Open command palette" },
      { keys: ["⌘", "/"], label: "Show keyboard shortcuts" },
      { keys: ["G", "H"], label: "Go home" },
      { keys: ["G", "P"], label: "Go to projects" },
      { keys: ["G", "I"], label: "Go to inbox" },
    ],
  },
  {
    name: "Navigation",
    shortcuts: [
      { keys: ["J"], label: "Next item" },
      { keys: ["K"], label: "Previous item" },
      { keys: ["⌘", "↵"], label: "Open selected" },
      { keys: ["Esc"], label: "Close overlay" },
    ],
  },
  {
    name: "Editing",
    shortcuts: [
      { keys: ["⌘", "S"], label: "Save changes" },
      { keys: ["⌘", "Z"], label: "Undo" },
      { keys: ["⌘", "⇧", "Z"], label: "Redo" },
      { keys: ["⌘", "B"], label: "Bold" },
      { keys: ["⌘", "I"], label: "Italic" },
    ],
  },
  {
    name: "Issues",
    shortcuts: [
      { keys: ["C"], label: "New issue" },
      { keys: ["A"], label: "Assign to…" },
      { keys: ["L"], label: "Add label" },
      { keys: ["P"], label: "Set priority" },
      { keys: ["⌘", "⇧", "M"], label: "Mark as done" },
    ],
  },
];
