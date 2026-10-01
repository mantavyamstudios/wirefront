import { useState } from "react";
import {
  BugIcon,
  HeartIcon,
  ImageIcon,
  LightbulbIcon,
} from "lucide-react";
import { Button } from "@orbit/ui/button";
import { Checkbox } from "@orbit/ui/checkbox";
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
import { Textarea } from "@orbit/ui/textarea";

type Kind = "bug" | "idea" | "praise";

const KINDS: {
  id: Kind;
  label: string;
  Icon: typeof BugIcon;
  description: string;
  tone: string;
}[] = [
  {
    id: "bug",
    label: "Something's broken",
    Icon: BugIcon,
    description: "An error, glitch, or unexpected behaviour.",
    tone: "rose",
  },
  {
    id: "idea",
    label: "I have an idea",
    Icon: LightbulbIcon,
    description: "Something that would make Acme better.",
    tone: "amber",
  },
  {
    id: "praise",
    label: "Praise",
    Icon: HeartIcon,
    description: "Something that delighted you. We share these on Mondays.",
    tone: "pink",
  },
];

export function ModalsFeedbackShowcasePage() {
  const [kind, setKind] = useState<Kind>("idea");

  return (
    // Real Dialog (focus trap, Esc, scroll lock); bottom sheet on phones.
    <div className="relative min-h-svh bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-10 sm:py-10">
        <div className="font-heading text-2xl">Project board</div>
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>Send feedback</DialogTrigger>
        <DialogPopup className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Send us feedback</DialogTitle>
            <DialogDescription>
              Goes to the product team. Replies within 1 business day.
            </DialogDescription>
          </DialogHeader>

          <DialogPanel className="space-y-4">
            <div role="radiogroup" aria-label="Feedback type" className="grid grid-cols-3 gap-2">
              {KINDS.map((k) => {
                const active = kind === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setKind(k.id)}
                    className={
                      "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-colors sm:px-3 " +
                      (active
                        ? "border-foreground/60 bg-foreground/[0.05]"
                        : "border-border/60 hover:border-foreground/30")
                    }
                  >
                    <k.Icon className="size-4 opacity-80" />
                    <span className="text-[12px] leading-tight">
                      {k.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-muted-foreground text-xs">
              {KINDS.find((k) => k.id === kind)?.description}
            </p>

            <Textarea
              aria-label="Your feedback"
              placeholder={
                kind === "bug"
                  ? "What did you do? What did you see? What did you expect?"
                  : kind === "idea"
                    ? "What would change? Who would it help?"
                    : "What worked well? Anyone we should call out?"
              }
              className="min-h-32"
            />

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-dashed border-border/70 bg-background px-3 py-2 text-muted-foreground text-xs hover:border-foreground/40 hover:text-foreground pointer-coarse:min-h-11"
            >
              <ImageIcon className="size-3.5" />
              Attach screenshot
            </button>
            <label className="flex cursor-pointer items-center gap-2 text-muted-foreground text-xs pointer-coarse:min-h-11">
              <Checkbox defaultChecked />
              Include console logs
            </label>
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
            <Button type="button">Send feedback</Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
      </div>
    </div>
  );
}
