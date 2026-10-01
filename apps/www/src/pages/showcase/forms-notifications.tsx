import { useState } from "react";
import { BellIcon, MailIcon, MessageSquareIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";
import { Separator } from "@orbit/ui/separator";
import { Switch } from "@orbit/ui/switch";

interface Pref {
  key: string;
  title: string;
  description: string;
  email: boolean;
  push: boolean;
}

const SECTIONS: { id: string; title: string; description: string; prefs: Pref[] }[] = [
  {
    id: "activity",
    title: "Activity",
    description: "Things happening in projects you follow.",
    prefs: [
      {
        key: "comments",
        title: "Comments and replies",
        description: "When someone replies to a thread you're in.",
        email: true,
        push: true,
      },
      {
        key: "mentions",
        title: "@mentions",
        description: "When you're called out specifically.",
        email: true,
        push: true,
      },
      {
        key: "assignments",
        title: "Assignments",
        description: "When something is assigned to you.",
        email: true,
        push: false,
      },
    ],
  },
  {
    id: "workspace",
    title: "Workspace",
    description: "Membership, billing, and admin events.",
    prefs: [
      {
        key: "invites",
        title: "New members",
        description: "Someone joins or accepts an invite.",
        email: false,
        push: false,
      },
      {
        key: "billing",
        title: "Billing receipts",
        description: "Monthly invoices and payment failures.",
        email: true,
        push: false,
      },
    ],
  },
  {
    id: "product",
    title: "Product updates",
    description: "Newsletters and what's new.",
    prefs: [
      {
        key: "weekly",
        title: "Weekly digest",
        description: "A short Monday summary of activity.",
        email: true,
        push: false,
      },
      {
        key: "changelog",
        title: "Changelog highlights",
        description: "Major shipments, ~once a month.",
        email: false,
        push: false,
      },
    ],
  },
];

export function FormsNotificationsShowcasePage() {
  const [prefs, setPrefs] = useState<Record<string, { email: boolean; push: boolean }>>(
    () => {
      const out: Record<string, { email: boolean; push: boolean }> = {};
      for (const s of SECTIONS) for (const p of s.prefs) out[p.key] = { email: p.email, push: p.push };
      return out;
    },
  );

  const flip = (key: string, channel: "email" | "push") =>
    setPrefs((p) => ({
      ...p,
      [key]: { ...p[key]!, [channel]: !p[key]![channel] },
    }));

  return (
    <div className="min-h-svh bg-background py-8 text-foreground sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Settings · Notifications
        </div>
        <h1 className="mt-1 font-heading text-3xl">Notifications</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Pick which moments deserve a tap on the shoulder. Defaults err on the
          quiet side — turn things on as you need them.
        </p>

        {/* Visual column headers; each switch carries its own accessible name. */}
        <div aria-hidden className="sticky top-0 z-10 mt-8 flex items-center justify-end gap-2 border-y border-border/60 bg-background/95 py-3 pr-4 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] backdrop-blur sm:gap-6 sm:tracking-[0.3em]">
          <span className="flex w-14 justify-center gap-1.5 sm:w-16">
            <MailIcon className="size-3.5 opacity-70" />
            Email
          </span>
          <span className="flex w-14 justify-center gap-1.5 sm:w-16">
            <BellIcon className="size-3.5 opacity-70" />
            Push
          </span>
        </div>

        {SECTIONS.map((section) => (
          <section key={section.id} className="mt-8">
            <header>
              <h2 className="font-heading text-base">{section.title}</h2>
              <p className="mt-0.5 text-muted-foreground text-xs">
                {section.description}
              </p>
            </header>

            <ul className="mt-4 divide-y divide-border/50 rounded-xl border border-border/60 bg-background/40">
              {section.prefs.map((p) => {
                const v = prefs[p.key]!;
                return (
                  <li
                    key={p.key}
                    className="flex items-center gap-2 py-1.5 pl-4 sm:gap-6"
                  >
                    <div className="min-w-0 flex-1 py-2">
                      <div className="font-medium text-sm">{p.title}</div>
                      <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                        {p.description}
                      </p>
                    </div>
                    <div className="flex items-stretch justify-center gap-2 pr-4 sm:gap-6">
                      {/* Each cell is a label so the whole 44px area toggles. */}
                      <label className="flex min-h-11 w-14 cursor-pointer items-center justify-center rounded-md hover:bg-foreground/[0.03] sm:w-16">
                        <Switch
                          aria-label={`${p.title} — email`}
                          checked={v.email}
                          onCheckedChange={() => flip(p.key, "email")}
                        />
                      </label>
                      <label className="flex min-h-11 w-14 cursor-pointer items-center justify-center rounded-md hover:bg-foreground/[0.03] sm:w-16">
                        <Switch
                          aria-label={`${p.title} — push`}
                          checked={v.push}
                          onCheckedChange={() => flip(p.key, "push")}
                        />
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>

          </section>
        ))}

        <Separator className="my-10" />

        <div className="rounded-xl border border-border/60 bg-background/40 p-4">
          <div className="flex items-start gap-3">
            <MessageSquareIcon className="mt-0.5 size-4 shrink-0 opacity-60" />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm">Quiet hours</div>
              <p className="mt-0.5 text-muted-foreground text-xs">
                Push notifications are paused between 10pm and 8am in your
                workspace timezone.
              </p>
            </div>
            <Button variant="outline" size="sm" type="button" className="pointer-coarse:h-11">
              Edit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
