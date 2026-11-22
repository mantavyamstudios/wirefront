// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state; changes save nowhere.
// Not shipped by the registry; builders wire TeamTimeOff to their own backend.
import { ok } from "@wirefront/ui/wirefront/types";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { TeamTimeOff } from "./view";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
let added = 0;

export function CalendarsHolidaysShowcasePage() {
  const state = useShowcaseState();
  return (
    <TeamTimeOff
      data={
        state === "loading" || state === "error"
          ? undefined
          : state === "empty"
            ? { members: [], holidays: [] }
            : fixtures.getTeamMonth
      }
      error="Time off didn’t load. Check your connection and try again."
      month={fixtures.month}
      onAddMember={async (input) => {
        await wait(400);
        added += 1;
        return ok({
          id: `new-${added}`,
          name: input.name,
          role: input.role,
          days: [],
        });
      }}
      onRemoveMember={() => wait(300)}
      onRetry={() => {}}
      onSetDay={() => wait(150)}
      onSetHoliday={() => wait(150)}
      status={
        state === "loading" ? "loading" : state === "error" ? "error" : "ready"
      }
      team={fixtures.team}
    />
  );
}
