// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: plays a webhook incident through to resolution inside devl.dev's
// sans-serif frame. Not shipped by the registry; builders wire StatusConsole to
// their own backend (and push updates to it however they like).
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useEffect, useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import type { ConsoleDeploy, IncidentUpdate, StatusOverview } from "./schema";
import { StatusConsole } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

/** When each scripted step lands, in ms after the page opens. */
const SCRIPT: { at: number; update?: IncidentUpdate; deploy?: "start" | "finish"; heal?: number }[] = [
  { at: 5000, update: fixtures.laterUpdates[0], deploy: "start" },
  { at: 12000, deploy: "finish", heal: 0.5 },
  { at: 13000, update: fixtures.laterUpdates[1] },
  { at: 21000, update: fixtures.laterUpdates[2], heal: 1 },
];

export function DashboardsStatusConsoleShowcasePage() {
  const state = useShowcaseState();
  const [environment, setEnvironment] = useState("Production");
  const [updates, setUpdates] = useState<IncidentUpdate[]>(fixtures.openingUpdates);
  const [deploys, setDeploys] = useState<ConsoleDeploy[]>(fixtures.deploys);
  const [heal, setHeal] = useState(0);
  const [noteSeq, setNoteSeq] = useState(0);

  useEffect(() => {
    const timers = SCRIPT.map((step) =>
      window.setTimeout(() => {
        const update = step.update;
        if (update) setUpdates((u) => [...u, update]);
        if (step.deploy === "start") setDeploys((d) => [fixtures.fixDeploy, ...d]);
        if (step.deploy === "finish") setDeploys((d) => d.map((x) => (x.id === "fix" ? { ...x, status: "succeeded", progress: 100 } : x)));
        if (step.heal !== undefined) setHeal(step.heal);
      }, step.at),
    );
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, []);

  const rolling = deploys.some((d) => d.status === "rolling");
  useEffect(() => {
    if (!rolling) return;
    const id = window.setInterval(() => setDeploys((d) => d.map((x) => (x.status === "rolling" ? { ...x, progress: Math.min(96, (x.progress ?? 0) + 9) } : x))), 500);
    return () => window.clearInterval(id);
  }, [rolling]);

  const note = (text: string): IncidentUpdate => ({ id: `note-${noteSeq}`, at: fixtures.now, state: "note", text, by: fixtures.currentUserId });
  const live: StatusOverview = {
    ...fixtures.getStatus,
    services: fixtures.services.map((s) =>
      s.id === "webhooks" ? { ...s, health: heal >= 1 ? "operational" : "degraded", errorRate: heal >= 1 ? 0.0004 : heal > 0 ? 0.006 : 0.024, p95Ms: Math.round(s.p95Ms * (1 - heal) + 180 * heal) } : s,
    ),
    incident: fixtures.getStatus.incident ? { ...fixtures.getStatus.incident, updates } : null,
    deploys,
  };
  const data = environment === "Production" ? live : fixtures.quietStatus;

  return (
    <DevlFrame>
      <WirefrontProvider locale="en-GB" now={demoNow} timeZone="Europe/London">
        <StatusConsole
          currentUserId={fixtures.currentUserId}
          data={state === "loading" || state === "error" ? undefined : state === "empty" ? fixtures.quietStatus : data}
          environment={environment}
          environments={fixtures.environments}
          error="The status API didn’t respond. Check your connection and try again."
          onEnvironmentChange={setEnvironment}
          onPage={async (personId) => {
            await wait(400);
            const name = fixtures.getStatus.people.find((p) => p.id === personId)?.name;
            setUpdates((u) => [...u, note(`Paged ${name}. Acknowledged in 40s.`)]);
            setNoteSeq((n) => n + 1);
          }}
          onPostUpdate={async ({ text }) => {
            await wait(300);
            setUpdates((u) => [...u, note(text)]);
            setNoteSeq((n) => n + 1);
          }}
          onRetry={() => {}}
          onRollback={async (id) => {
            await wait(400);
            setDeploys((all) => all.map((x) => (x.id === id ? { ...x, status: "rolled-back" } : x)));
          }}
          status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
          updatedAt={fixtures.now}
        />
      </WirefrontProvider>
    </DevlFrame>
  );
}
