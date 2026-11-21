// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { Habit, NewHabit } from "./schema";

/** The demo clock: Saturday of the sample week. */
export const now = "2026-10-24T09:00:00Z";
export const weekStart = "2026-10-19";
export const productName = "Kindling";

/** Demo data for the showcase, the generated mocks and tests. */
export const listHabits: Habit[] = [
  { id: "h1", name: "Morning pages", icon: "journal", tone: "amber", time: "morning", carry: 37, week: [1, 1, 1, 1, 1, 1, 0] },
  { id: "h2", name: "Stretch for 10 minutes", icon: "stretch", tone: "violet", time: "morning", carry: 0, week: [1, 0, 1, 1, 1, 1, 0] },
  { id: "h3", name: "Drink water", icon: "water", tone: "sky", time: "anytime", goal: { count: 8, unit: "glasses" }, carry: 9, week: [8, 8, 8, 8, 8, 5, 0] },
  { id: "h4", name: "Walk 8,000 steps", icon: "walk", tone: "teal", time: "anytime", carry: 4, week: [1, 1, 1, 1, 1, 0, 0] },
  { id: "h5", name: "Read 20 pages", icon: "read", tone: "orange", time: "evening", carry: 2, week: [1, 1, 0, 1, 1, 0, 0] },
  { id: "h6", name: "Lights out by 11", icon: "sleep", tone: "rose", time: "evening", carry: 0, week: [1, 1, 1, 0, 1, 0, 0] },
];

/** One-tap starting points in the new-habit sheet. */
export const suggestions: NewHabit[] = [
  { name: "Meditate", icon: "meditate", tone: "violet", time: "morning" },
  { name: "Eat a vegetable", icon: "veg", tone: "orange", time: "anytime", goal: { count: 3, unit: "servings" } },
  { name: "Practice guitar", icon: "music", tone: "rose", time: "evening" },
  { name: "Get outside", icon: "sun", tone: "amber", time: "anytime" },
];

export const createHabit: Habit = { id: "h-new", name: "Meditate", icon: "meditate", tone: "violet", time: "morning", carry: 0, since: 5, week: [0, 0, 0, 0, 0, 0, 0] };
