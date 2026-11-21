// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the top of the org; expanding Carlos loads his reports from the fixtures.
// Not shipped by the registry; builders wire OrgChart to their own backend.
import { useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { OrgChart } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ProfileOrgChartShowcasePage() {
  const state = useShowcaseState();
  const [people, setPeople] = useState(fixtures.listOrg.people);
  return (
    <OrgChart
      company={fixtures.company}
      error="The org chart didn’t load. Check your connection and try again."
      onLoadReports={async (id) => {
        await wait(500);
        const more = fixtures.listReports.filter((p) => p.managerId === id);
        setPeople((all) => [...all, ...more]);
      }}
      onRetry={() => {}}
      people={state === "loading" || state === "error" ? undefined : state === "empty" ? [] : people}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      total={fixtures.listOrg.total}
    />
  );
}
