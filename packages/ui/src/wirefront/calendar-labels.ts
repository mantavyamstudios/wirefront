// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Accessible names for shadcn Calendar day buttons. The button shows the day
 * number, so its name starts with it (WCAG 2.5.3, label in name);
 * react-day-picker's default ("Monday, April 14th, 2026") doesn't contain "14".
 *
 *   <Calendar labels={calendarLabels(locale)} … />
 */
export function calendarLabels(locale?: string) {
  return {
    // Weekday and month-year are formatted separately: ICU builds disagree on
    // how to order a combined weekday + month + year pattern (Node's ICU 79
    // gives "Monday, February 2026", Chromium "February 2026 Monday"), which
    // breaks hydration when the server and the browser format it.
    labelDayButton: (date: Date, modifiers: { today?: boolean; selected?: boolean }) =>
      `${modifiers.today ? "Today, " : ""}${date.getDate()}, ${date.toLocaleDateString(locale, { weekday: "long" })}, ${date.toLocaleDateString(locale, { month: "long", year: "numeric" })}${modifiers.selected ? ", selected" : ""}`,
  };
}
