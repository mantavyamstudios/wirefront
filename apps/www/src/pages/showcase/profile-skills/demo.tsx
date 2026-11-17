// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire SkillEndorsements to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { SkillEndorsements } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ProfileSkillsShowcasePage() {
  const state = useShowcaseState();
  return (
    <SkillEndorsements
      error="Skills didn’t load. Check your connection and try again."
      onAddSkill={() => {}}
      onEndorse={() => wait(300)}
      onRetry={() => {}}
      person={fixtures.person}
      skills={state === "loading" || state === "error" ? undefined : state === "empty" ? [] : fixtures.listSkills}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
    />
  );
}
