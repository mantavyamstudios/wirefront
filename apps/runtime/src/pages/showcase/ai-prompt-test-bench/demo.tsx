// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: a simulated eval runner in devl.dev's frame. Cases run three at a time and a
// fake judge scores them from the sample data; the first prompt re-runs on load.
// Not shipped by the registry; builders load results from their own eval backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { DatabaseIcon, SettingsIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import type { CaseResult, PromptSummary, VersionReview } from "./schema";
import { PromptTestBench } from "./view";

const demoNow = () => new Date("2026-10-22T15:00:00Z");
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
const links = [
  { label: "Datasets", href: "#datasets", icon: <DatabaseIcon /> },
  { label: "Settings", href: "#settings", icon: <SettingsIcon /> },
];
const CONCURRENCY = 3;

function settled(
  p: fixtures.SamplePrompt,
  versionId: string
): Record<string, CaseResult> {
  const v = p.versions.find((x) => x.id === versionId);
  return v
    ? Object.fromEntries(
        p.cases.map((c) => [
          c.id,
          fixtures.resultFor(c, fixtures.baseScore(c, v)),
        ])
      )
    : {};
}

export function AiPromptTestBenchShowcasePage() {
  const reduce = useReducedMotion();
  const first = fixtures.samplePrompts[0] as fixtures.SamplePrompt;
  const [name, setName] = useState(first.name);
  const sample = fixtures.samplePrompts.find((p) => p.name === name) ?? first;
  const [versionId, setVersionId] = useState(sample.versions.at(-1)?.id ?? "");
  const [results, setResults] = useState(() => settled(first, versionId));
  const [reviews, setReviews] = useState<
    Record<string, VersionReview | undefined>
  >({});
  const [summaries, setSummaries] = useState<PromptSummary[]>(
    fixtures.listPrompts
  );
  const run = useRef(0);

  const queue = useCallback(
    (ids: string[]) =>
      setResults((prev) => ({
        ...prev,
        ...Object.fromEntries(
          ids.map((id) => [
            id,
            { status: "queued" as const, score: prev[id]?.score ?? null },
          ])
        ),
      })),
    []
  );

  // Re-run every case of the first prompt shortly after load.
  useEffect(() => {
    const id = setTimeout(() => queue(first.cases.map((c) => c.id)), 900);
    return () => clearTimeout(id);
  }, [first, queue]);

  // Start queued cases while there is a free slot; each one resolves after a short, random wait.
  useEffect(() => {
    const running = Object.values(results).filter(
      (r) => r.status === "running"
    ).length;
    const start = sample.cases
      .filter((c) => results[c.id]?.status === "queued")
      .slice(0, CONCURRENCY - running);
    const version = sample.versions.find((v) => v.id === versionId);
    if (!start.length || !version) return;
    const token = run.current;
    setResults((prev) => ({
      ...prev,
      ...Object.fromEntries(
        start.map((c) => [
          c.id,
          { status: "running" as const, score: prev[c.id]?.score ?? null },
        ])
      ),
    }));
    for (const c of start) {
      setTimeout(
        () => {
          if (token !== run.current) return;
          const score = Math.min(
            1,
            Math.max(
              0,
              fixtures.baseScore(c, version) + (Math.random() - 0.5) * 0.1
            )
          );
          setResults((prev) => ({
            ...prev,
            [c.id]: fixtures.resultFor(c, score),
          }));
        },
        reduce ? 250 : 700 + Math.random() * 1100
      );
    }
  }, [results, sample, versionId, reduce]);

  // Keep the sidebar's pass rate in step with the latest version's finished run.
  useEffect(() => {
    const latest = sample.versions.at(-1)?.id;
    const all = sample.cases.map((c) => results[c.id]);
    if (
      versionId !== latest ||
      all.some((r) => !r || r.status === "queued" || r.status === "running")
    )
      return;
    const rate =
      all.filter((r) => r?.status === "pass").length / Math.max(all.length, 1);
    setSummaries((s) =>
      s.map((p) =>
        p.name === sample.name && p.passRate !== rate
          ? { ...p, passRate: rate }
          : p
      )
    );
  }, [results, sample, versionId]);

  const prompt = useMemo(() => fixtures.toBenchPrompt(sample), [sample]);
  const versionReviews = useMemo(
    () =>
      Object.fromEntries(
        sample.versions.map((v) => [v.id, reviews[`${sample.name}/${v.id}`]])
      ),
    [sample, reviews]
  );

  const show = (p: fixtures.SamplePrompt, v: string) => {
    run.current++;
    setVersionId(v);
    setResults(settled(p, v));
  };

  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <PromptTestBench
          links={links}
          onReview={async ({ versionId: v, kind, comment }) => {
            await wait(300);
            setReviews((r) => ({
              ...r,
              [`${name}/${v}`]: {
                kind,
                comment,
                by: fixtures.user.name,
                at: demoNow().toISOString(),
              },
            }));
          }}
          onRun={queue}
          onSelectPrompt={(next) => {
            const p = fixtures.samplePrompts.find((x) => x.name === next);
            if (!p) return;
            setName(next);
            show(p, p.versions.at(-1)?.id ?? "");
          }}
          onSelectVersion={(v) => show(sample, v)}
          onWithdrawReview={async ({ versionId: v }) => {
            await wait(200);
            setReviews((r) => ({ ...r, [`${name}/${v}`]: undefined }));
          }}
          passMark={fixtures.passMark}
          prompt={prompt}
          prompts={summaries}
          results={results}
          reviews={versionReviews}
          threshold={fixtures.threshold}
          user={fixtures.user}
          versionId={versionId}
          workspace={fixtures.workspace}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
