// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Toast } from "@base-ui/react/toast";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import { BellIcon, GitPullRequestIcon, MessageCircleIcon, UserPlusIcon, XIcon } from "lucide-react";
import { type ReactNode, useState } from "react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("activityToaster.<key>"). */
export const ACTIVITY_TOASTER_MESSAGES = {
  dismiss: "Dismiss",
  more: "+{count} more",
  less: "Show less",
};

export interface ActivityToast {
  id: string;
  /** Picks the badge icon and colour. */
  kind: "reply" | "review" | "join" | "other";
  title: string;
  description?: string;
  /** When it happened (ISO 8601), shown relative. */
  at: string;
  /** Who it's from, for the avatar. */
  actor?: string;
  /** Buttons; each closes the toast after running. */
  actions?: { label: string; primary?: boolean; onSelect?: () => void }[];
}

type ActivityData = Omit<ActivityToast, "id" | "title" | "description">;
export type ActivityToastManager = ReturnType<typeof Toast.createToastManager<ActivityData>>;

export const createActivityToasts = (): ActivityToastManager => Toast.createToastManager<ActivityData>();

/** Show an activity notification. It stays until acted on or dismissed. */
export function notifyActivity(manager: ActivityToastManager, { id, title, description, ...data }: ActivityToast) {
  return manager.add({ id, title, description, timeout: 0, data });
}

const KIND: Record<ActivityToast["kind"], { icon: ReactNode; tone: string }> = {
  reply: { icon: <MessageCircleIcon className="size-3" />, tone: "bg-category-1/15 text-category-1-foreground" },
  review: { icon: <GitPullRequestIcon className="size-3" />, tone: "bg-category-5/15 text-category-5-foreground" },
  join: { icon: <UserPlusIcon className="size-3" />, tone: "bg-category-2/15 text-category-2-foreground" },
  other: { icon: <BellIcon className="size-3" />, tone: "bg-foreground/8 text-foreground" },
};
const AVATAR_TONES = ["bg-category-5-strong", "bg-category-3-strong", "bg-category-2-strong", "bg-category-1-strong"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export interface ActivityToasterProps {
  toastManager: ActivityToastManager;
  /** Your app; notifications render above it. */
  children?: ReactNode;
  /** How many show at once. Defaults to 5. */
  limit?: number;
  className?: string;
}

// sm+: every notification listed top-right. Phones: only the newest shows, full width,
// with a "+N more" pill that expands the rest.
function Viewport({ manager, className }: { manager: ActivityToastManager; className?: string }) {
  const t = useMessages("activityToaster", ACTIVITY_TOASTER_MESSAGES);
  const fmt = useFormat();
  const { toasts } = Toast.useToastManager<ActivityData>();
  const [expanded, setExpanded] = useState(false);
  const hidden = toasts.length - 1;
  return (
    <Toast.Portal>
      <Toast.Viewport className={cn("fixed inset-x-0 top-0 z-50 flex max-h-svh flex-col gap-2 overflow-y-auto px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 outline-none sm:inset-x-auto sm:inset-e-6 sm:top-6 sm:w-95 sm:overflow-visible sm:px-0 sm:pt-0", className)}>
        {toasts.map((toast, i) => {
          const d = toast.data;
          const kind = KIND[d?.kind ?? "other"];
          return (
            <Toast.Root
              className={cn(
                "translate-x-(--toast-swipe-movement-x) translate-y-(--toast-swipe-movement-y) rounded-xl border border-border/70 bg-background p-3.5 shadow-lg transition-[translate,opacity] duration-300 data-ending-style:opacity-0 data-starting-style:-translate-y-3 data-starting-style:opacity-0 motion-reduce:transition-none",
                i > 0 && !expanded && "max-sm:hidden",
              )}
              key={toast.id}
              swipeDirection={["right", "up"]}
              toast={toast}
            >
              <div className="flex items-start gap-3">
                {d?.actor ? (
                  <div aria-hidden className={cn("flex size-8 shrink-0 items-center justify-center rounded-full font-medium text-[11px] text-white", AVATAR_TONES[d.actor.length % AVATAR_TONES.length])}>
                    {initials(d.actor)}
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", kind.tone)}>
                      {kind.icon}
                    </span>
                    <Toast.Title className="min-w-0 truncate font-medium text-sm" />
                  </div>
                  <Toast.Description className="mt-1 text-muted-foreground text-xs leading-relaxed" />
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                    {d?.at ? (
                      <time className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]" dateTime={d.at}>
                        {fmt.relative(d.at)}
                      </time>
                    ) : (
                      <span />
                    )}
                    {d?.actions?.length ? (
                      <div className="flex items-center gap-1">
                        {d.actions.map((a) => (
                          <Toast.Action
                            key={a.label}
                            onClick={() => {
                              a.onSelect?.();
                              manager.close(toast.id);
                            }}
                            render={<Button size="xs" type="button" variant={a.primary ? "default" : "ghost"} />}
                          >
                            {a.label}
                          </Toast.Action>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <Toast.Close aria-label={t.dismiss} className="-me-1.5 -mt-1.5 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10">
                  <XIcon aria-hidden className="size-3.5" />
                </Toast.Close>
              </div>
            </Toast.Root>
          );
        })}
        {hidden > 0 ? (
          <button
            aria-expanded={expanded}
            className="min-h-10 self-center rounded-full border border-border/70 bg-background px-4 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.15em] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
            onClick={() => setExpanded((e) => !e)}
            type="button"
          >
            {expanded ? t.less : interpolate(t.more, { count: hidden })}
          </button>
        ) : null}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

/** The provider and viewport for rich activity notifications. Mount it once around your app. */
export function ActivityToaster({ toastManager, children, limit = 5, className }: ActivityToasterProps) {
  return (
    <ScreenBoundary name="ActivityToaster">
      <Toast.Provider limit={limit} toastManager={toastManager}>
        {children}
        <Viewport className={className} manager={toastManager} />
      </Toast.Provider>
    </ScreenBoundary>
  );
}
