import { useState } from "react";
import {
  BuildingIcon,
  EyeIcon,
  GlobeIcon,
  LockIcon,
  PlusIcon,
} from "lucide-react";
import { Button } from "@orbit/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@orbit/ui/dialog";
import { Input } from "@orbit/ui/input";

type Visibility = "private" | "team" | "public";

const VIZ: {
  id: Visibility;
  label: string;
  meta: string;
  Icon: typeof LockIcon;
}[] = [
  {
    id: "private",
    label: "Private",
    meta: "Only invited members can join",
    Icon: LockIcon,
  },
  {
    id: "team",
    label: "Team",
    meta: "Anyone in @acme.dev can request access",
    Icon: EyeIcon,
  },
  {
    id: "public",
    label: "Public",
    meta: "Anyone with the link can join",
    Icon: GlobeIcon,
  },
];

export function ModalsCreateWorkspaceShowcasePage() {
  const [name, setName] = useState("Acme studios");
  const [viz, setViz] = useState<Visibility>("team");
  const slug = slugify(name);

  return (
    // Real Dialog with a scrolling body, so the footer stays reachable when the
    // virtual keyboard is open; bottom sheet on phones.
    <div className="relative min-h-svh bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-10 sm:py-10">
        <div className="font-heading text-2xl">Workspaces</div>
      <Dialog defaultOpen>
        <DialogTrigger render={<Button />}>
          <PlusIcon />
          New workspace
        </DialogTrigger>
        <DialogPopup>
          <DialogHeader className="flex-row items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06]">
              <BuildingIcon className="size-4 opacity-80" />
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <DialogTitle className="text-base">Create a new workspace</DialogTitle>
              <DialogDescription className="text-xs">
                You can change these later in settings.
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogPanel className="space-y-5">
            <div>
              <label htmlFor="ws-create-name" className="mb-1.5 block font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                Workspace name
              </label>
              <Input
                id="ws-create-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme studios"
              />
              <div className="mt-1.5 text-muted-foreground text-xs">
                14 / 50
              </div>
            </div>

            <div>
              <div className="mb-1.5 block font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                Workspace URL
              </div>
              <div className="flex h-10 min-w-0 items-center rounded-md border border-border bg-background pl-3 transition-colors focus-within:border-foreground/40">
                <span className="shrink-0 text-muted-foreground text-sm">
                  acme.dev/
                </span>
                <code className="min-w-0 flex-1 truncate bg-transparent font-mono text-foreground text-sm outline-none">
                  {slug || "your-workspace"}
                </code>
                <span className="mr-2 inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                  <span className="size-1 rounded-full bg-emerald-500" />
                  available
                </span>
              </div>
            </div>

            <div>
              <div id="ws-viz-label" className="mb-2 block font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                Visibility
              </div>
              <div role="radiogroup" aria-labelledby="ws-viz-label" className="flex flex-col gap-2">
                {VIZ.map((v) => {
                  const active = viz === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setViz(v.id)}
                      className={
                        "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors " +
                        (active
                          ? "border-foreground/60 bg-foreground/[0.04]"
                          : "border-border/60 hover:border-foreground/30")
                      }
                    >
                      <span
                        className={
                          "mt-1 size-3.5 shrink-0 rounded-full border " +
                          (active
                            ? "border-foreground bg-foreground ring-2 ring-foreground/20 ring-offset-2 ring-offset-background"
                            : "border-border")
                        }
                      />
                      <v.Icon className="mt-0.5 size-4 opacity-70" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm">{v.label}</div>
                        <div className="text-muted-foreground text-xs">
                          {v.meta}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </DialogPanel>

          <DialogFooter className="sm:items-center">
            <span className="text-center text-muted-foreground text-xs sm:me-auto sm:text-left">
              Step 1 of 3 · Workspace
            </span>
            <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
            <Button type="button">Create workspace</Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
      </div>
    </div>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
