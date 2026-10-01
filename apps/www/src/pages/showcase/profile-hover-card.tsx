import {
  CalendarDaysIcon,
  CheckIcon,
  MapPinIcon,
  PlusIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@orbit/ui/avatar";
import { Button } from "@orbit/ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "@orbit/ui/popover";

export function ProfileHoverCardShowcasePage() {
  return (
    <div className="grid min-h-svh place-items-center bg-background px-4 py-8 sm:px-8 sm:py-10">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Source comment context */}
        <article className="rounded-xl border border-border/60 bg-background/40 p-4 leading-relaxed sm:p-6">
          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
            <span>#design-crit</span>
            <span>·</span>
            <span>2h ago</span>
          </div>
          <p className="mt-3 text-foreground/85 text-sm">
            I think we can ship the audit log retention work before the
            offsite. <Mention name="Maya Okafor" initials="MO" /> already has
            the migration in flight, and the UI just needs the new field on
            the workspace settings panel. Pinging{" "}
            <Mention name="James Lin" initials="JL" /> in case you want to
            review the tracking events before merge.
          </p>
          <p className="mt-3 text-foreground/85 text-sm">
            We could also pair on this — happy to grab 30 minutes tomorrow
            morning if it helps.
          </p>
          <div className="mt-4 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            <button
              type="button"
              className="min-h-8 rounded px-2 hover:bg-foreground/[0.04] pointer-coarse:min-h-10"
            >
              ↑ 12
            </button>
            <button
              type="button"
              className="min-h-8 rounded px-2 hover:bg-foreground/[0.04] pointer-coarse:min-h-10"
            >
              Reply
            </button>
            <button
              type="button"
              className="min-h-8 rounded px-2 hover:bg-foreground/[0.04] pointer-coarse:min-h-10"
            >
              Share
            </button>
          </div>
        </article>

        {/* Hover card */}
        <div className="lg:pt-12">
          <ProfileCard className="rounded-xl border border-border shadow-2xl" />

          {/* Trigger pointer */}
          <div className="mt-2 ml-8 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            <span className="block h-px w-8 bg-border" />
            <span className="pointer-coarse:hidden">hover a mention · 200ms delay</span>
            <span className="hidden pointer-coarse:inline">tap a mention to open</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ className }: { className?: string }) {
  return (
    <div
      className={
        "relative w-[min(20rem,calc(100vw-2rem))] overflow-hidden bg-background " +
        (className ?? "")
      }
    >
      {/* Cover */}
      <div className="h-16 bg-gradient-to-br from-indigo-500/30 via-foreground/[0.04] to-teal-500/30" />

      <div className="relative px-4 pb-4">
        <Avatar className="-mt-7 size-14 border-4 border-background bg-foreground">
          <AvatarFallback className="bg-foreground text-background">
            MO
          </AvatarFallback>
        </Avatar>

        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-base">Maya Okafor</span>
              <span className="grid size-4 shrink-0 place-items-center rounded-full bg-blue-500 text-white">
                <span className="sr-only">Verified</span>
                <CheckIcon aria-hidden className="size-2.5" />
              </span>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              @maya · she/her
            </div>
          </div>
          <Button size="sm" type="button">
            <PlusIcon />
            Follow
          </Button>
        </div>

        <p className="mt-3 text-foreground/85 text-sm leading-snug">
          Engineering at Acme. Building the audit log so security teams
          can sleep.
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-muted-foreground text-xs">
          <span className="inline-flex items-center gap-1.5">
            <MapPinIcon className="size-3" />
            Brooklyn, NY
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDaysIcon className="size-3" />
            Joined Apr 2021
          </span>
        </div>

        <div className="mt-3 flex items-center gap-4 border-border/60 border-t pt-3 text-xs">
          <span>
            <span className="font-mono">284</span>{" "}
            <span className="text-muted-foreground">following</span>
          </span>
          <span>
            <span className="font-mono">12.4k</span>{" "}
            <span className="text-muted-foreground">followers</span>
          </span>
        </div>

        <div className="mt-3 flex items-start -space-x-1.5">
          {["JL", "RP", "DK"].map((a) => (
            <Avatar
              key={a}
              className="size-5 border-2 border-background"
            >
              <AvatarFallback className="text-[10px]">
                {a}
              </AvatarFallback>
            </Avatar>
          ))}
          <span className="ml-3 min-w-0 text-muted-foreground text-xs">
            Followed by James, Riya, Dani and 8 others you follow
          </span>
        </div>
      </div>
    </div>
  );
}

// A Popover that opens on hover for mice (200ms delay) and on tap for touch,
// so the card isn't pointer-only. Keyboard users open it with Enter/Space.
function Mention({
  name,
  initials,
}: {
  name: string;
  initials: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={200}
        className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2 py-0.5 align-baseline font-medium text-foreground/90 hover:bg-foreground/[0.1] pointer-coarse:py-1"
      >
        <Avatar className="size-3.5">
          <AvatarFallback className="text-[8px]">{initials}</AvatarFallback>
        </Avatar>
        @{name}
      </PopoverTrigger>
      <PopoverPopup
        aria-label={`${name} profile`}
        className="overflow-hidden [&_[data-slot=popover-viewport]]:p-0"
      >
        <ProfileCard />
      </PopoverPopup>
    </Popover>
  );
}
