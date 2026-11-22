// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Popover } from "@base-ui/react/popover";
import { Button } from "@wirefront/ui/button";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
} from "@wirefront/ui/wirefront/provider";
import type { Hint } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("featureBeacon.<key>"). */
export const FEATURE_BEACON_MESSAGES = {
  trigger: "Hint: {title}",
  added: "New · {date}",
  gotIt: "Got it",
};

export interface FeatureBeaconProps {
  hint: Hint;
  /** Open the hint on mount. */
  defaultOpen?: boolean;
  /** Called with the hint id when they click "Got it"; hide the beacon then. */
  onDismiss: (id: string) => void;
}

// Beacons live inside the element they point at (a relative wrapper), so they move with the
// layout. Each is a Popover trigger with a 40px hit area around the visible dot; Base UI
// positions the hint and keeps it on screen.
function FeatureBeaconScreen({
  hint,
  defaultOpen = false,
  onDismiss,
}: FeatureBeaconProps) {
  const t = useMessages("featureBeacon", FEATURE_BEACON_MESSAGES);
  const fmt = useFormat();
  return (
    <Popover.Root defaultOpen={defaultOpen} modal={false}>
      <Popover.Trigger
        aria-label={interpolate(t.trigger, { title: hint.title })}
        className="absolute -inset-e-3 -top-3 z-10 grid size-10 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          aria-hidden
          className="absolute size-4 rounded-full bg-primary/60 motion-safe:animate-ping"
          style={{ animationDuration: "1.6s" }}
        />
        <span
          aria-hidden
          className="relative size-2.5 rounded-full bg-primary ring-2 ring-background"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align="end"
          className="z-40"
          collisionPadding={16}
          side="bottom"
          sideOffset={4}
        >
          <Popover.Popup
            className="w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border/70 bg-background p-3.5 shadow-2xl outline-none motion-safe:transition-[opacity,scale] data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
            initialFocus={false}
          >
            <Popover.Title className="font-medium text-sm">
              {hint.title}
            </Popover.Title>
            <Popover.Description className="mt-1 text-muted-foreground text-xs leading-relaxed">
              {hint.body}
            </Popover.Description>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                {hint.addedAt
                  ? interpolate(t.added, {
                      date: fmt.date(`${hint.addedAt}T00:00:00Z`, {
                        month: "long",
                        day: "numeric",
                        timeZone: "UTC",
                      }),
                    })
                  : null}
              </span>
              <Popover.Close
                onClick={() => onDismiss(hint.id)}
                render={<Button size="sm" type="button" variant="ghost" />}
              >
                {t.gotIt}
              </Popover.Close>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function FeatureBeacon(props: FeatureBeaconProps) {
  return (
    <ScreenBoundary name="FeatureBeacon">
      <FeatureBeaconScreen {...props} />
    </ScreenBoundary>
  );
}
