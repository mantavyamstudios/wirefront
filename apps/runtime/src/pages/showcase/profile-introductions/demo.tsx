// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire SuggestedIntros to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { SuggestedIntros } from "./view";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ProfileIntroductionsShowcasePage() {
  const state = useShowcaseState();
  return (
    <SuggestedIntros
      allHref="#suggestions"
      error="Suggestions didn’t load. Check your connection and try again."
      onDismiss={() => wait(300)}
      onFollow={() => wait(300)}
      onRetry={() => {}}
      status={
        state === "loading" ? "loading" : state === "error" ? "error" : "ready"
      }
      suggestions={
        state === "loading" || state === "error"
          ? undefined
          : state === "empty"
            ? []
            : fixtures.listSuggestions
      }
    />
  );
}
