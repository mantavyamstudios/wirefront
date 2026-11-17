// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and fakes an export's progress.
// Not shipped by the registry; builders wire PrivacyData to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useEffect, useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import type { DataExport, PrivacySettings } from "./schema";
import { PrivacyData } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

export function SettingsPrivacyShowcasePage() {
  const state = useShowcaseState();
  const [latestExport, setLatestExport] = useState<DataExport | null>(null);
  const [deletion, setDeletion] = useState<PrivacySettings["deletion"]>(null);

  const running = latestExport?.status === "running";
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLatestExport((e) => {
        if (!e) return e;
        const progress = Math.min(100, e.progress + 12);
        return progress >= 100 ? fixtures.readyExport : { ...e, progress };
      });
    }, 500);
    return () => window.clearInterval(id);
  }, [running]);

  const data: PrivacySettings = { ...fixtures.getPrivacy, latestExport, deletion };
  return (
    <WirefrontProvider now={demoNow}>
      <PrivacyData
        data={state === "loading" || state === "error" ? undefined : data}
        error="Privacy settings didn’t load. Check your connection and try again."
        onCancelDeletion={async () => {
          await wait(500);
          setDeletion(null);
        }}
        onRequestDeletion={async () => {
          await wait(500);
          setDeletion(fixtures.pendingDeletion);
        }}
        onRequestExport={async () => {
          await wait(300);
          setLatestExport(fixtures.requestExport);
        }}
        onRetry={() => {}}
        onSetRetention={() => wait(300)}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      />
    </WirefrontProvider>
  );
}
