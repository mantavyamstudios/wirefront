import {
  ChevronDownIcon,
  CopyIcon,
  GlobeIcon,
  LinkIcon,
  LockIcon,
  Share2Icon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@orbit/ui/avatar";
import { Button } from "@orbit/ui/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@orbit/ui/dialog";
import { Input } from "@orbit/ui/input";

const MEMBERS = [
  { name: "Maya Okafor", email: "maya@acme.dev", role: "Owner", initials: "MO" },
  { name: "James Lin", email: "james@acme.dev", role: "Editor", initials: "JL" },
  { name: "Riya Patel", email: "riya@acme.dev", role: "Viewer", initials: "RP" },
  { name: "Dani Kim", email: "dani@acme.dev", role: "Editor", initials: "DK" },
];

const LINK = "https://acme.dev/d/onboarding-handbook-v3-3b9f2a";

// Real Dialog: focus trap, Esc, scroll lock, labelled title. Opens by default
// for the showcase; on phones it becomes a bottom sheet with a scrolling body.
export function ModalsShareLinkShowcasePage() {
  return (
    <div className="relative min-h-svh bg-background">
      <div className="flex flex-col gap-4 px-4 py-8 sm:flex-row sm:items-start sm:justify-between sm:px-10 sm:py-10">
        <div>
          <div className="font-heading text-2xl">Onboarding handbook v3</div>
          <div className="mt-2 text-muted-foreground text-sm">
            Last edited by Maya 2h ago · 14 collaborators
          </div>
        </div>

        <Dialog defaultOpen>
          <DialogTrigger render={<Button variant="outline" className="self-start" />}>
            <Share2Icon />
            Share
          </DialogTrigger>
          <DialogPopup>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 pe-8 text-base">
                <LinkIcon className="size-4 shrink-0 opacity-60" />
                <span className="min-w-0 truncate">Share "Onboarding handbook v3"</span>
              </DialogTitle>
            </DialogHeader>

            <DialogPanel className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  aria-label="Add people, groups, or emails"
                  placeholder="Add people, groups, or emails…"
                  className="min-w-0 flex-1"
                />
                <RoleButton label="Editor" />
              </div>

              <div className="rounded-lg border border-border/60 bg-background p-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06]">
                    <GlobeIcon className="size-4 opacity-70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-2">
                      <span className="text-sm">Anyone with the link</span>
                      <RoleButton label="Can view" />
                    </div>
                    <div className="mt-1 text-muted-foreground text-xs">
                      No sign-in required. Anyone can view this document.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border/60 bg-background py-1 pr-1 pl-3">
                <LockIcon className="size-3.5 shrink-0 opacity-50" />
                <code className="min-w-0 flex-1 truncate font-mono text-xs">{LINK}</code>
                <Button size="sm" variant="ghost" type="button" aria-label="Copy link" className="shrink-0">
                  <CopyIcon />
                  <span className="max-sm:sr-only">Copy</span>
                </Button>
              </div>

              <div>
                <div className="mb-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                  People with access · {MEMBERS.length}
                </div>
                <ul className="divide-y divide-border/40 rounded-lg border border-border/60">
                  {MEMBERS.map((m) => (
                    <li key={m.email} className="flex items-center gap-3 px-3 py-2.5">
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="text-[10px]">
                          {m.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">{m.name}</div>
                        <div className="truncate text-muted-foreground text-xs">
                          {m.email}
                        </div>
                      </div>
                      <RoleButton label={m.role} for={m.name} />
                    </li>
                  ))}
                </ul>
              </div>
            </DialogPanel>

            <DialogFooter className="sm:items-center sm:justify-between">
              <span className="text-center text-muted-foreground text-xs sm:text-left">
                Workspace defaults to viewer access
              </span>
              <DialogClose render={<Button type="button" />}>Done</DialogClose>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      </div>
    </div>
  );
}

function RoleButton({ label, for: who }: { label: string; for?: string }) {
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-label={who ? `${who}: ${label}` : label}
      className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md border border-border/60 px-2.5 font-mono text-[11px] text-muted-foreground hover:bg-foreground/[0.05] pointer-coarse:min-h-10"
    >
      {label}
      <ChevronDownIcon className="size-3" />
    </button>
  );
}
