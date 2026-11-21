// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as agenda from "@/pages/showcase/calendars-agenda/fixtures";
import { DayAgenda } from "@/pages/showcase/calendars-agenda/view";
import * as cw from "@/pages/showcase/calendars-calendar-week/fixtures";
import { CalendarWeek } from "@/pages/showcase/calendars-calendar-week/view";
import * as range from "@/pages/showcase/calendars-date-range/fixtures";
import { DateRangePicker } from "@/pages/showcase/calendars-date-range/view";
import * as holidays from "@/pages/showcase/calendars-holidays/fixtures";
import { TeamTimeOff } from "@/pages/showcase/calendars-holidays/view";
import * as mini from "@/pages/showcase/calendars-mini/fixtures";
import { MiniCalendar } from "@/pages/showcase/calendars-mini/view";
import * as month from "@/pages/showcase/calendars-month/fixtures";
import { MonthCalendar } from "@/pages/showcase/calendars-month/view";
import * as recurring from "@/pages/showcase/calendars-recurring/fixtures";
import { expand, RecurrenceEditor } from "@/pages/showcase/calendars-recurring/view";
import * as tz from "@/pages/showcase/calendars-timezone/fixtures";
import { MeetingPlanner } from "@/pages/showcase/calendars-timezone/view";
import * as week from "@/pages/showcase/calendars-week/fixtures";
import { WeekSchedule } from "@/pages/showcase/calendars-week/view";
import * as heatmap from "@/pages/showcase/calendars-year-heatmap/fixtures";
import { ContributionHeatmap } from "@/pages/showcase/calendars-year-heatmap/view";

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Element.prototype.scrollTo = () => {};
  // Base UI reads running animations; jsdom has none.
  Element.prototype.getAnimations = () => [];
});
afterEach(cleanup);

const at = (now: string, ui: ReactNode, locale = "en-US") =>
  render(
    <WirefrontProvider locale={locale} now={() => new Date(now)} timeZone="UTC">
      {ui}
    </WirefrontProvider>,
  );

describe("calendars", () => {
  it("MonthCalendar marks today, counts events and changes month", () => {
    const onMonthChange = vi.fn();
    at(month.now, <MonthCalendar events={month.listMonthEvents} month="2026-04" onMonthChange={onMonthChange} />);
    expect(screen.getByRole("heading", { name: "April 2026" })).toBeTruthy();
    const today = screen.getByRole("button", { name: "April 26, 3 events: Sprint demo, Coffee w/ Riya, Audit log review" });
    expect(today.getAttribute("aria-current")).toBe("date");
    expect(screen.getByRole("button", { name: "April 20, 1 event: Vacation" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(onMonthChange).toHaveBeenCalledWith("2026-05");
  });

  it("WeekSchedule lays out overlapping events side by side and moves by week", () => {
    const onWeekChange = vi.fn();
    at(week.now, <WeekSchedule events={week.listWeekEvents} onWeekChange={onWeekChange} weekStart="2026-04-27" />, "en-GB");
    const a = screen.getByText("BigCorp call").closest("li") as HTMLElement;
    const b = screen.getByText("Riya · sync").closest("li") as HTMLElement;
    expect(a.style.width).toBe("calc(50% - 8px)");
    expect(b.style.insetInlineStart).toBe("calc(50% + 4px)");
    expect(screen.getByText("Now")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    expect(onWeekChange).toHaveBeenCalledWith("2026-04-20");
  });

  it("DayAgenda sums booked and focus time and shows free gaps", () => {
    at(agenda.now, <DayAgenda events={agenda.listAgenda} />, "en-GB");
    expect(screen.getByText("8 events · 8h 0m booked · 7h 10m focus time.")).toBeTruthy();
    expect(screen.getByText("Free · 1h 10m")).toBeTruthy();
    expect(screen.queryByText("Free · 20m")).toBeTruthy();
  });

  it("MiniCalendar counts today's events and lists a picked day", () => {
    at(mini.now, <MiniCalendar events={mini.listMiniEvents} month="2026-04" showDayList />, "en-GB");
    fireEvent.click(screen.getByRole("button", { name: /^April 7, 2 events$/ }));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    cleanup();
    at(mini.now, <MiniCalendar events={mini.listMiniEvents} month="2026-04" />, "en-GB");
    expect(screen.getByText("4 events today")).toBeTruthy();
  });

  it("DateRangePicker matches presets to the range and applies it", () => {
    const onApply = vi.fn();
    at(range.now, <DateRangePicker defaultValue={range.defaultRange} onApply={onApply} />);
    expect(screen.getByRole("button", { name: "Last 14 days" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Last month" }));
    expect(screen.getByText("31 days · Mar 1 → Mar 31, 2026")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Apply range" }));
    expect(onApply).toHaveBeenCalledWith({ from: "2026-03-01", to: "2026-03-31" });
  });

  it("MeetingPlanner judges each zone, finds the best window and books it", () => {
    const onUseTime = vi.fn();
    render(
      <WirefrontProvider locale="en-US" now={() => new Date(tz.now)} timeZone={tz.homeZone}>
        <MeetingPlanner availableZones={tz.availableZones} defaultZones={["America/New_York", "Europe/London"]} homeZone={tz.homeZone} onUseTime={onUseTime} />
      </WirefrontProvider>,
    );
    // 13:00–16:00 New York is 18:00–21:00 London: on the edge there.
    expect(screen.getByText("1 working · 1 on the edge.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Find best" }));
    expect(screen.getByText("Everyone in working hours.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Use this time" }));
    const window = onUseTime.mock.calls[0]?.[0];
    expect(new Date(window.end).getTime() - new Date(window.start).getTime()).toBe(3 * 3_600_000);
    fireEvent.click(screen.getByRole("button", { name: "Remove London" }));
    expect(screen.getByText("Everyone in working hours.")).toBeTruthy();
  });

  it("ContributionHeatmap totals the year and searches", async () => {
    const onSearch = vi.fn(async () => {});
    at(heatmap.now, <ContributionHeatmap data={heatmap.getContributions} onSearch={onSearch} />);
    const total = heatmap.getContributions.days.reduce((s, d) => s + d.count, 0);
    expect(screen.getByRole("heading", { name: new RegExp(`^${total.toLocaleString("en-US")} contributions`) })).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Username" }), { target: { value: "octo" } });
    fireEvent.click(screen.getByRole("button", { name: "Load" }));
    expect(onSearch).toHaveBeenCalledWith("octo");
  });

  it("TeamTimeOff counts overlaps, toggles days and finds the clearest week", async () => {
    const onSetDay = vi.fn(async () => {});
    at("2026-05-01T12:00:00Z", <TeamTimeOff data={holidays.getTeamMonth} month="2026-05" onSetDay={onSetDay} team="Acme team" />);
    expect(screen.getByText("5 day(s) with 2+ out · 18 day(s) off · 1 holiday(s)")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Mark Vacation for Alex Tran on May 4" }));
    expect(onSetDay).toHaveBeenCalledWith({ memberId: "m6", date: "2026-05-04", type: "vacation" });
    expect(await screen.findByRole("button", { name: "Clear Vacation for Alex Tran on May 4" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Find clearest week/ }));
    expect(screen.getByText(/^Clearest week: /)).toBeTruthy();
  });

  it("RecurrenceEditor describes the rule, expands it and saves the RRULE", async () => {
    const onSave = vi.fn(async () => {});
    at("2026-04-26T12:00:00Z", <RecurrenceEditor defaultRule={recurring.defaultRule} onSave={onSave} presets={recurring.presets} start={recurring.start} />);
    expect(screen.getByText("Every week on Mon, Wed, Fri, until Jul 26, 2026.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Last Friday" }));
    expect(screen.getByText("Every month on the last Fri, until Jul 26, 2026.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save recurrence" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ rule: expect.objectContaining({ freq: "MONTHLY", bysetpos: -1 }), rrule: "RRULE:FREQ=MONTHLY;BYDAY=FR;BYSETPOS=-1;UNTIL=20260726T000000Z" }));
    expect(expand({ ...recurring.defaultRule, freq: "MONTHLY", monthlyMode: "weekday", bysetpos: -1, bydayPositional: ["FR"] }, "2026-04-26")).toEqual(["2026-05-29", "2026-06-26"]);
  });

  it("CalendarWeek saves a moved event and reverts it when saving fails", async () => {
    const onSaveEvent = vi.fn(async () => ({ ok: false as const, error: "Calendar is read-only." }));
    at(cw.now, <CalendarWeek calendars={cw.listCalendars} events={cw.listEvents} onSaveEvent={onSaveEvent} />);
    const card = screen.getAllByRole("button", { name: /Q4 pricing decision/ })[0] as HTMLElement;
    fireEvent.focus(card);
    fireEvent.keyDown(card, { key: "ArrowDown" });
    await waitFor(() => expect(onSaveEvent).toHaveBeenCalledWith(expect.objectContaining({ id: "e10", start: 615, end: 660 })));
    expect(await screen.findByText("Calendar is read-only.")).toBeTruthy();
    expect(within(card).getByText(/10 AM – 10:45 AM/)).toBeTruthy();
  });
});
