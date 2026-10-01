import { useState } from "react";
import { LayersIcon, SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";
import { PopoverPrimitive as Popover } from "@orbit/ui/popover";

// Beacons live *inside* the element they point at (a relative wrapper), so they
// move with the layout. Each one is a Popover trigger with a 40px hit area
// around the visible dot; Base UI positions the hint and keeps it on screen.
export function ToursBeaconShowcasePage() {
  const [seen, setSeen] = useState<string[]>([]);
  const dismiss = (id: string) => setSeen((s) => [...s, id]);

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside className="space-y-2 border-border/60 border-r bg-foreground/[0.02] p-4 max-md:hidden">
          <div className="h-3 w-28 rounded bg-foreground/15" />
          <div className="h-2 w-32 rounded bg-foreground/10" />
          <div className="h-2 w-28 rounded bg-foreground/10" />
          <div className="h-2 w-24 rounded bg-foreground/10" />
        </aside>
        <main className="min-w-0 p-4 sm:p-6 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
                Inbox
              </div>
              <h1 className="mt-1 font-heading text-2xl sm:text-3xl">Today</h1>
            </div>
            <div className="relative">
              <Button type="button" variant="outline" size="sm">
                <LayersIcon />
                Stack view
              </Button>
              {!seen.includes("stack") ? (
                <Beacon
                  defaultOpen
                  title="Stack views are new."
                  body="Group your inbox by project, sender, or status. Use this button to switch."
                  onDismiss={() => dismiss("stack")}
                />
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="relative h-32 rounded-xl border border-border/50 bg-foreground/[0.02] p-4"
              >
                <div className="h-2 w-24 rounded bg-foreground/15" />
                <div className="mt-2 h-2 w-32 max-w-full rounded bg-foreground/10" />
                <div className="mt-2 h-2 w-28 max-w-full rounded bg-foreground/10" />
                {i === 2 ? (
                  <div className="absolute right-3 bottom-3">
                    <span className="relative inline-flex">
                      <SlidersHorizontalIcon aria-hidden className="size-4 text-muted-foreground" />
                      {!seen.includes("filters") ? (
                        <Beacon
                          title="Card filters"
                          body="Each card can be filtered on its own without changing the rest of your inbox."
                          onDismiss={() => dismiss("filters")}
                        />
                      ) : null}
                    </span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function Beacon({
  title,
  body,
  defaultOpen = false,
  onDismiss,
}: {
  title: string;
  body: string;
  defaultOpen?: boolean;
  onDismiss: () => void;
}) {
  return (
    <Popover.Root defaultOpen={defaultOpen} modal={false}>
      <Popover.Trigger
        aria-label={`Hint: ${title}`}
        // 40px invisible hit area over the corner of the parent.
        className="-top-3 -right-3 absolute z-10 grid size-10 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          aria-hidden
          className="absolute size-4 rounded-full bg-primary/60 motion-safe:animate-ping"
          style={{ animationDuration: "1.6s" }}
        />
        <span aria-hidden className="relative size-2.5 rounded-full bg-primary ring-2 ring-background" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={4}
          collisionPadding={16}
          className="z-40"
        >
          <Popover.Popup
            initialFocus={false}
            className="w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border/70 bg-background p-3.5 shadow-2xl outline-none motion-safe:transition-[opacity,scale] data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
          >
            <Popover.Title className="font-medium text-sm">{title}</Popover.Title>
            <Popover.Description className="mt-1 text-muted-foreground text-xs leading-relaxed">
              {body}
            </Popover.Description>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.25em]">
                New · April 26
              </span>
              <Popover.Close
                render={<Button size="sm" variant="ghost" type="button" />}
                onClick={onDismiss}
              >
                Got it
              </Popover.Close>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
