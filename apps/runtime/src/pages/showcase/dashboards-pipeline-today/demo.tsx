// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: wires the view to fixture data inside devl.dev's sans-serif frame.
// Not shipped by the registry; builders wire PipelineToday to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { Building2Icon, ChartNoAxesColumnIcon, InboxIcon, KanbanIcon, SunriseIcon } from "lucide-react";
import { useShowcaseState } from "@/lib/showcase-state";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { PipelineToday } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

const NAV = [
  { label: "Today", href: "#today", icon: <SunriseIcon aria-hidden />, current: true },
  { label: "Pipeline", href: "#pipeline", icon: <KanbanIcon aria-hidden /> },
  { label: "Accounts", href: "#accounts", icon: <Building2Icon aria-hidden /> },
  { label: "Inbox", href: "#inbox", icon: <InboxIcon aria-hidden />, badge: true },
  { label: "Reports", href: "#reports", icon: <ChartNoAxesColumnIcon aria-hidden /> },
];

export function DashboardsPipelineTodayShowcasePage() {
  const state = useShowcaseState();
  return (
    <DevlFrame>
      <WirefrontProvider currency="USD" locale="en-US" now={demoNow} timeZone="Europe/London">
        <PipelineToday
          currentUserId={fixtures.currentUserId}
          data={state === "loading" || state === "error" ? undefined : state === "empty" ? { ...fixtures.getPipeline, signals: [] } : fixtures.getPipeline}
          error="The CRM didn’t respond. Check your connection and try again."
          forecastLabel="Q4 weighted forecast"
          nav={NAV}
          onDealMove={() => wait(300)}
          onRetry={() => {}}
          onSignalAction={() => wait(300)}
          settingsHref="#settings"
          status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
          target={fixtures.target}
          workspace={fixtures.workspace}
        />
      </WirefrontProvider>
    </DevlFrame>
  );
}
