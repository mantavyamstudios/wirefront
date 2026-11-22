// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { RecurrencePreset, RecurrenceRule } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const start = "2026-04-26";

export const defaultRule: RecurrenceRule = {
  freq: "WEEKLY",
  interval: 1,
  byday: ["MO", "WE", "FR"],
  bymonthday: [1],
  bysetpos: -1,
  bydayPositional: ["FR"],
  monthlyMode: "weekday",
  end: { type: "until", date: "2026-07-26" },
};

export const presets: RecurrencePreset[] = [
  {
    id: "weekdays",
    label: "Every weekday",
    rule: {
      freq: "WEEKLY",
      interval: 1,
      byday: ["MO", "TU", "WE", "TH", "FR"],
    },
  },
  {
    id: "mwf",
    label: "Mon · Wed · Fri",
    rule: { freq: "WEEKLY", interval: 1, byday: ["MO", "WE", "FR"] },
  },
  {
    id: "biweekly",
    label: "Bi-weekly Tue",
    rule: { freq: "WEEKLY", interval: 2, byday: ["TU"] },
  },
  {
    id: "last-friday",
    label: "Last Friday",
    rule: {
      freq: "MONTHLY",
      interval: 1,
      monthlyMode: "weekday",
      bysetpos: -1,
      bydayPositional: ["FR"],
    },
  },
  {
    id: "1-15",
    label: "1st & 15th",
    rule: {
      freq: "MONTHLY",
      interval: 1,
      monthlyMode: "day",
      bymonthday: [1, 15],
    },
  },
  {
    id: "last-day",
    label: "Last day of month",
    rule: {
      freq: "MONTHLY",
      interval: 1,
      monthlyMode: "day",
      bymonthday: [-1],
    },
  },
  {
    id: "first-weekday",
    label: "1st weekday",
    rule: {
      freq: "MONTHLY",
      interval: 1,
      monthlyMode: "weekday",
      bysetpos: 1,
      bydayPositional: ["MO", "TU", "WE", "TH", "FR"],
    },
  },
  {
    id: "quarterly",
    label: "Quarterly",
    rule: { freq: "MONTHLY", interval: 3, monthlyMode: "day", bymonthday: [1] },
  },
];
