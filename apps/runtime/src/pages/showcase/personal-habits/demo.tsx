// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: a sample week of habits in devl.dev's frame with a fixed clock (Saturday).
// Ticks save at once; new habits start today. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import { useRef } from "react";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { Habits } from "./view";

const demoNow = () => new Date(fixtures.now);

export function PersonalHabitsShowcasePage() {
  const count = useRef(0);
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <Habits
          habits={fixtures.listHabits}
          onCreate={async (habit) => ok({ ...habit, id: `new-${++count.current}`, carry: 0, since: 5, week: [0, 0, 0, 0, 0, 0, 0] })}
          onLog={async () => {}}
          productName={fixtures.productName}
          suggestions={fixtures.suggestions}
          weekStart={fixtures.weekStart}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
