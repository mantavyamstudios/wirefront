// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The metrics overview's wiring contract: raw numbers in, formatted in the
 * builder's locale and currency; the range control reports changes; loading,
 * empty and error states.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import * as fixtures from "@/pages/showcase/dashboards-metrics-overview/fixtures";
import { api, Overview } from "@/pages/showcase/dashboards-metrics-overview/schema";
import { MetricsOverview } from "@/pages/showcase/dashboards-metrics-overview/view";

afterEach(cleanup);

const now = () => new Date(fixtures.now);

function renderOverview(props: Partial<ComponentProps<typeof MetricsOverview>> = {}, provider: { locale?: string; currency?: string } = {}) {
  const onRangeChange = vi.fn();
  render(
    <WirefrontProvider now={now} {...provider}>
      <MetricsOverview data={fixtures.getOverview} onRangeChange={onRangeChange} range="30d" {...props} />
    </WirefrontProvider>,
  );
  return { onRangeChange };
}

describe("MetricsOverview", () => {
  it("formats raw values by unit and colours changes by what is good news", () => {
    renderOverview();
    expect(screen.getAllByText("12,408").length).toBeGreaterThan(0);
    expect(screen.getByText("$48.6K")).toBeTruthy();
    expect(screen.getByText("1.8%")).toBeTruthy();
    expect(screen.getByText("6m 22s")).toBeTruthy();
    // Churn fell (-0.3%) and lower churn is good: shown as good news.
    expect(screen.getByText("-0.3%").className).toContain("emerald");
    // Sessions got shorter (-1.1%): bad news.
    expect(screen.getByText("-1.1%").className).toContain("rose");
  });

  it("uses the builder's locale and currency", () => {
    renderOverview({}, { locale: "de-DE", currency: "EUR" });
    expect(screen.getAllByText("12.408").length).toBeGreaterThan(0);
    expect(screen.getByText(/^48\.600\s€$/)).toBeTruthy();
  });

  it("reports range changes and shows relative activity times", () => {
    const { onRangeChange } = renderOverview();
    fireEvent.click(screen.getByRole("button", { name: "7d" }));
    expect(onRangeChange).toHaveBeenCalledWith("7d");
    fireEvent.click(screen.getByRole("button", { name: "30d" }));
    expect(onRangeChange).toHaveBeenCalledTimes(1);
    expect(screen.getByText("2 minutes ago")).toBeTruthy();
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("Active users over 30 days, latest 12,600");
  });

  it("shows loading, empty and error states", () => {
    renderOverview({ data: undefined, status: "loading" });
    expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("true");
    cleanup();

    renderOverview({ data: fixtures.emptyOverview });
    expect(screen.getByText("No data for this period yet.")).toBeTruthy();
    expect(screen.getByText("Nothing has happened here yet.")).toBeTruthy();
    cleanup();

    const onRetry = vi.fn();
    renderOverview({ data: undefined, status: "error", error: "Timed out.", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("shows optional actions only when wired", () => {
    renderOverview();
    expect(screen.queryByRole("button", { name: "New report" })).toBeNull();
    expect(screen.queryByText("See all")).toBeNull();
  });

  it("describes its backend operation, and the fixtures satisfy it", () => {
    expect(Object.keys(api)).toEqual(["getOverview"]);
    for (const range of ["7d", "30d", "90d"] as const) expect(Overview.safeParse(fixtures.overviewFor(range)).success).toBe(true);
    expect(Overview.safeParse(fixtures.emptyOverview).success).toBe(true);
  });
});
