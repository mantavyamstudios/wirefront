// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as mix from "@/pages/showcase/charts-donut/fixtures";
import { RevenueMixDonut } from "@/pages/showcase/charts-donut/view";
import * as bars from "@/pages/showcase/charts-bar-grouped/fixtures";
import { QuarterlyComparisonChart } from "@/pages/showcase/charts-bar-grouped/view";
import * as cohorts from "@/pages/showcase/charts-cohort-heatmap/fixtures";
import { CohortRetention } from "@/pages/showcase/charts-cohort-heatmap/view";
import * as funnel from "@/pages/showcase/charts-funnel/fixtures";
import { ConversionFunnel } from "@/pages/showcase/charts-funnel/view";
import * as gauges from "@/pages/showcase/charts-gauges/fixtures";
import { SloGauges } from "@/pages/showcase/charts-gauges/view";
import * as usage from "@/pages/showcase/charts-line-multi/fixtures";
import { PlatformUsageChart } from "@/pages/showcase/charts-line-multi/view";
import * as revenue from "@/pages/showcase/charts-revenue-area/fixtures";
import { RevenueBreakdownChart } from "@/pages/showcase/charts-revenue-area/view";
import * as scatter from "@/pages/showcase/charts-scatter/fixtures";
import { AccountHealthScatter } from "@/pages/showcase/charts-scatter/view";
import * as waterfall from "@/pages/showcase/charts-waterfall/fixtures";
import { ArrWaterfall } from "@/pages/showcase/charts-waterfall/view";

// Recharts measures its container; jsdom has no layout.
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
});
afterEach(cleanup);

describe("charts are computed from their data", () => {
  it("RevenueBreakdownChart totals the months and compares with the period before", () => {
    render(<RevenueBreakdownChart data={revenue.getRevenueBreakdown} />);
    expect(screen.getByText("$760K")).toBeTruthy();
    expect(screen.getByText("+18.4% vs prev. 12mo")).toBeTruthy();
    expect(screen.getByRole("img", { name: /monthly revenue by stream, May to Apr\. Total \$760K/ })).toBeTruthy();
  });

  it("QuarterlyComparisonChart compares the newest series over the quarters it has reached", () => {
    render(<QuarterlyComparisonChart data={bars.getPeriodComparison} />);
    // Q1–Q3 2026 vs Q1–Q3 2025: 944k / 648k.
    expect(screen.getByText("vs prev year · +46%")).toBeTruthy();
  });

  it("RevenueMixDonut derives the total, shares and change", () => {
    render(<RevenueMixDonut data={mix.getRevenueMix} />);
    expect(screen.getByText("$1.84M")).toBeTruthy();
    expect(screen.getByText("+14.2% vs last quarter")).toBeTruthy();
    expect(screen.getByText("64.4%")).toBeTruthy();
    expect(screen.getByText("$1,184,960")).toBeTruthy();
  });

  it("ConversionFunnel derives conversion, drops and highlight tones", () => {
    render(<ConversionFunnel data={funnel.getFunnel} />);
    expect(screen.getByText("End-to-end conversion: 3.87% of visitors reach the last stage.")).toBeTruthy();
    expect(screen.getByText("-74.1% drop (35,734)")).toBeTruthy();
    const cards = screen.getAllByRole("listitem").filter((li) => li.textContent?.includes("→"));
    expect(cards.map((c) => c.textContent)).toEqual(["Visit → Signup25.9%good", "Signup → Activate33.7%watch", "Activate → Invite44.3%good"]);
  });

  it("SloGauges judges each objective by its direction", () => {
    render(<SloGauges objectives={[...gauges.listObjectives, { id: "slow", name: "P99 latency", value: 900, target: 800, unit: "ms", direction: "lower", max: 1200 }]} />);
    expect(screen.getByRole("img", { name: "P95 latency: 248ms, target 300ms, on track." })).toBeTruthy();
    expect(screen.getByRole("img", { name: "P99 latency: 900ms, target 800ms, breached." })).toBeTruthy();
  });

  it("CohortRetention averages the chosen month over cohorts that reached it", () => {
    render(<CohortRetention cohorts={cohorts.listCohorts} />);
    const m3 = cohorts.listCohorts.flatMap((c) => (c.retention[3] === undefined ? [] : [c.retention[3]]));
    const avg = m3.reduce((a, b) => a + b, 0) / m3.length;
    expect(screen.getByText(`Average M3: ${new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(avg / 100)}`)).toBeTruthy();
    expect(screen.getByRole("img", { name: "Apr 2025, month 0: 96% retained" })).toBeTruthy();
  });

  it("AccountHealthScatter counts accounts in the risk quadrant", () => {
    render(<AccountHealthScatter accounts={scatter.listAccountHealth} />);
    expect(screen.getByText("4 at risk")).toBeTruthy();
    expect(screen.getByRole("img", { name: /At risk: Pied Piper, Globex, Soylent, Rekall\./ })).toBeTruthy();
  });

  it("ArrWaterfall ends at the start plus every step", () => {
    render(<ArrWaterfall data={waterfall.getArrMovement} />);
    expect(screen.getByText("Net growth +25.2%")).toBeTruthy();
    expect(screen.getByRole("img", { name: /to Q1 ARR \$2\.05M/ })).toBeTruthy();
  });
});

describe("PlatformUsageChart", () => {
  it("toggles series but keeps one, and asks for another range", () => {
    const onRangeChange = vi.fn();
    render(<PlatformUsageChart data={usage.getDailyActiveUsers} onRangeChange={onRangeChange} range="30d" ranges={[{ id: "7d", label: "7d" }, { id: "30d", label: "30d" }]} />);
    const web = screen.getByRole("button", { name: /Web/ });
    const ios = screen.getByRole("button", { name: /iOS/ });
    const android = screen.getByRole("button", { name: /Android/ });
    fireEvent.click(web);
    fireEvent.click(ios);
    fireEvent.click(android);
    expect([web, ios, android].map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "false", "true"]);
    expect(screen.getByRole("img", { name: /: Android 158\.$/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "7d" }));
    expect(onRangeChange).toHaveBeenCalledWith("7d");
  });

  it("hides the range picker without onRangeChange", () => {
    render(<PlatformUsageChart data={usage.getDailyActiveUsers} ranges={[{ id: "7d", label: "7d" }]} />);
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });
});

describe("chart states", () => {
  it("shows the error with a retry, and an empty message", () => {
    const onRetry = vi.fn();
    const { unmount } = render(<SloGauges error="Timed out." onRetry={onRetry} status="error" />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
    unmount();
    render(<ConversionFunnel data={{ stages: [] }} />);
    expect(screen.getByText("No one has entered the funnel yet.")).toBeTruthy();
  });
});
