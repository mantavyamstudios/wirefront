import { useEffect, useState } from "react";
import {
  GitPullRequestIcon,
  MessageCircleIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@orbit/ui/button";
import { ToastPrimitive as Toast } from "@orbit/ui/toast";

interface RichData {
  Icon: React.ComponentType<{ className?: string }>;
  badgeTone: string;
  meta: string;
  actions?: { label: string; primary?: boolean }[];
  avatar?: { initials: string; tone: string };
}

const SEED: { id: string; title: string; description: string; data: RichData }[] = [
  {
    id: "reply",
    title: "Riya replied",
    description: "@sean — same — let's pair on the bouncing invites tomorrow morning.",
    data: {
      Icon: MessageCircleIcon,
      badgeTone: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
      meta: "12m ago",
      actions: [{ label: "Reply" }],
      avatar: { initials: "RP", tone: "bg-violet-500/85 text-white" },
    },
  },
  {
    id: "pr",
    title: "PR #128 ready for review",
    description: 'James moved "audit log query rewrite" to ready.',
    data: {
      Icon: GitPullRequestIcon,
      badgeTone: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
      meta: "2m ago",
      actions: [{ label: "Snooze" }, { label: "Review", primary: true }],
      avatar: { initials: "JL", tone: "bg-amber-500/85 text-white" },
    },
  },
  {
    id: "joined",
    title: "Maya joined the workspace",
    description: "Auto-joined via @acme.com domain rule. Say hi or assign a project.",
    data: {
      Icon: UserPlusIcon,
      badgeTone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      meta: "just now",
      actions: [{ label: "Assign" }, { label: "Welcome", primary: true }],
      avatar: { initials: "MO", tone: "bg-emerald-500/85 text-white" },
    },
  },
];

// A dedicated manager keeps this showcase self-contained. In an app, mount
// <ToastProvider> once and use the shared `toastManager` from @orbit/ui/toast.
const toasts = Toast.createToastManager<RichData>();

function seed() {
  // Oldest first, so the newest ends up on top. Persistent until acted on.
  for (const t of SEED) toasts.add({ ...t, timeout: 0 });
}

export function ToastsRichShowcasePage() {
  useEffect(() => seed(), []);
  return (
    <Toast.Provider toastManager={toasts} limit={5}>
      <div className="relative min-h-svh bg-background text-foreground">
        <FakeAppBackdrop onReplay={seed} />
        <RichViewport />
      </div>
    </Toast.Provider>
  );
}

// sm+: every notification listed top-right. Phones: only the newest shows,
// full width, with a "+N more" pill that expands the rest (Sonner-style).
function RichViewport() {
  const { toasts: list } = Toast.useToastManager<RichData>();
  const [expanded, setExpanded] = useState(false);
  const hidden = list.length - 1;

  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed inset-x-0 top-0 z-50 flex max-h-svh flex-col gap-2 overflow-y-auto px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 outline-none sm:inset-x-auto sm:top-6 sm:right-6 sm:w-[380px] sm:overflow-visible sm:px-0 sm:pt-0">
        {list.map((t, i) => {
          const d = t.data!;
          return (
            <Toast.Root
              key={t.id}
              toast={t}
              swipeDirection={["right", "up"]}
              className={
                "translate-x-(--toast-swipe-movement-x) translate-y-(--toast-swipe-movement-y) rounded-xl border border-border/70 bg-background p-3.5 shadow-lg transition-[translate,opacity] duration-300 data-ending-style:opacity-0 data-starting-style:-translate-y-3 data-starting-style:opacity-0 motion-reduce:transition-none " +
                (i > 0 && !expanded ? "max-sm:hidden" : "")
              }
            >
              <div className="flex items-start gap-3">
                {d.avatar ? (
                  <div
                    aria-hidden
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full font-medium text-[11px] ${d.avatar.tone}`}
                  >
                    {d.avatar.initials}
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full ${d.badgeTone}`}
                    >
                      <d.Icon className="size-3" />
                    </span>
                    <Toast.Title className="min-w-0 truncate font-medium text-sm" />
                  </div>
                  <Toast.Description className="mt-1 text-muted-foreground text-xs leading-relaxed" />
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.2em]">
                      {d.meta}
                    </span>
                    {d.actions ? (
                      <div className="flex items-center gap-1">
                        {d.actions.map((a) => (
                          <Toast.Close
                            key={a.label}
                            render={
                              <Button
                                size="xs"
                                variant={a.primary ? "default" : "ghost"}
                                type="button"
                              />
                            }
                          >
                            {a.label}
                          </Toast.Close>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <Toast.Close
                  aria-label="Dismiss"
                  className="-mt-1.5 -mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:size-10"
                >
                  <XIcon className="size-3.5" />
                </Toast.Close>
              </div>
            </Toast.Root>
          );
        })}
        {hidden > 0 ? (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((e) => !e)}
            className="min-h-10 self-center rounded-full border border-border/70 bg-background px-4 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.15em] shadow-sm sm:hidden"
          >
            {expanded ? "Show less" : `+${hidden} more`}
          </button>
        ) : null}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

function FakeAppBackdrop({ onReplay }: { onReplay: () => void }) {
  return (
    <div className="space-y-3 p-4 pt-56 sm:p-10">
      <div aria-hidden className="space-y-3 opacity-50">
        <div className="h-4 w-56 max-w-full rounded bg-foreground/15" />
        <div className="h-2 w-72 max-w-full rounded bg-foreground/10" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl border border-border/40 bg-foreground/[0.02]"
            />
          ))}
        </div>
      </div>
      <Button type="button" variant="outline" onClick={onReplay}>
        Replay notifications
      </Button>
    </div>
  );
}
