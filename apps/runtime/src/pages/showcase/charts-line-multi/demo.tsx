// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// The range picker slices the fixture's 30 days instead of fetching.
// Not shipped by the registry; builders wire PlatformUsageChart to their own backend.
import { useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { PlatformUsageChart } from "./view";

const RANGES = Object.keys(fixtures.ranges).map((id) => ({ id, label: id }));

export function ChartsLineMultiShowcasePage() {
  const state = useShowcaseState();
  const [range, setRange] = useState("30d");
  const days = fixtures.ranges[range as keyof typeof fixtures.ranges] ?? 30;
  const data = {
    ...fixtures.getDailyActiveUsers,
    points: fixtures.getDailyActiveUsers.points.slice(-days),
  };
  return (
    <PlatformUsageChart
      data={
        state === "loading" || state === "error"
          ? undefined
          : state === "empty"
            ? { ...data, points: [] }
            : data
      }
      error="Usage didn’t load. Check your connection and try again."
      onRangeChange={setRange}
      onRetry={() => {}}
      range={range}
      ranges={RANGES}
      status={
        state === "loading" ? "loading" : state === "error" ? "error" : "ready"
      }
    />
  );
}
