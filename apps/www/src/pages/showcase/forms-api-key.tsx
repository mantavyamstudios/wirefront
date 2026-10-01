import { type FormEvent, useState } from "react";
import { CopyIcon, KeyIcon, TerminalIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";
import { Checkbox } from "@orbit/ui/checkbox";
import { Input } from "@orbit/ui/input";
import { Label } from "@orbit/ui/label";

interface Scope {
  id: string;
  label: string;
  description: string;
  destructive?: boolean;
}

const SCOPES: { group: string; items: Scope[] }[] = [
  {
    group: "Read",
    items: [
      {
        id: "read:projects",
        label: "Projects",
        description: "List and read project metadata.",
      },
      {
        id: "read:members",
        label: "Members",
        description: "List members and their roles.",
      },
      {
        id: "read:audit",
        label: "Audit log",
        description: "Read the last 90 days of activity.",
      },
    ],
  },
  {
    group: "Write",
    items: [
      {
        id: "write:projects",
        label: "Projects",
        description: "Create, update, and archive projects.",
      },
      {
        id: "write:members",
        label: "Members",
        description: "Invite, remove, and change roles.",
        destructive: true,
      },
    ],
  },
];

export function FormsApiKeyShowcasePage() {
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("90");
  const [scopes, setScopes] = useState<Set<string>>(
    new Set(["read:projects", "read:members"]),
  );
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleScope = (id: string) =>
    setScopes((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || scopes.size === 0) return;
    setGenerated(`orb_live_${Math.random().toString(36).slice(2, 18)}`);
  };

  if (generated) {
    return (
      <div className="flex min-h-svh justify-center bg-background px-4 py-8 text-foreground sm:items-center sm:px-6">
        <div className="w-full max-w-md sm:rounded-2xl sm:border sm:border-border/60 sm:bg-background/60 sm:p-6">
          <div className="inline-flex size-10 items-center justify-center rounded-full bg-foreground/[0.06]">
            <KeyIcon className="size-5" aria-hidden />
          </div>
          <h2 className="mt-4 font-heading text-xl">Your new key.</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Copy it now — you won't see this again.
          </p>

          <div className="mt-5 flex items-start gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 font-mono text-[12px]">
            <TerminalIcon className="mt-0.5 size-3.5 shrink-0 opacity-50" />
            {/* Wraps on small screens so the whole secret can be checked. */}
            <span className="min-w-0 flex-1 break-all sm:truncate sm:break-normal">{generated}</span>
            <button
              type="button"
              onClick={() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              }}
              aria-live="polite"
              className="inline-flex min-h-7 shrink-0 items-center gap-1 rounded px-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:min-h-11"
            >
              <CopyIcon className="size-3" />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={() => setGenerated(null)} className="max-sm:w-full pointer-coarse:h-11">
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Top-aligned on phones so a tall form never loses its heading; the card
    // chrome only appears where there's room for it.
    <div className="flex min-h-svh justify-center bg-background px-4 py-8 text-foreground sm:items-center sm:px-6 sm:py-16">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg sm:rounded-2xl sm:border sm:border-border/60 sm:bg-background/60 sm:p-6 sm:shadow-sm"
      >
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          API · new key
        </div>
        <h1 className="mt-1 font-heading text-2xl">Create an API key.</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Issue a token for a script, integration, or CLI. Scope it tightly.
        </p>

        <div className="mt-6 flex flex-col gap-1.5">
          <Label htmlFor="key-name">Name</Label>
          <Input
            id="key-name"
            placeholder="e.g. CI deploy bot"
            value={name}
            onChange={(e) => setName(e.target.value)}
            nativeInput
          />
          <p className="text-muted-foreground text-xs">
            For your own bookkeeping — visible to admins only.
          </p>
        </div>

        <div className="mt-6">
          <Label className="font-medium text-sm">Scopes</Label>
          <p className="mt-0.5 text-muted-foreground text-xs">
            Pick the smallest set this key actually needs.
          </p>

          <div className="mt-3 flex flex-col gap-4">
            {SCOPES.map((group) => (
              <div key={group.group}>
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                  {group.group}
                </div>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {group.items.map((s) => {
                    const checked = scopes.has(s.id);
                    return (
                      <li key={s.id}>
                        <label
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                            checked
                              ? s.destructive
                                ? "border-destructive/40 bg-destructive/[0.04]"
                                : "border-foreground/30 bg-foreground/[0.03]"
                              : "border-border/60 bg-background/40 hover:border-border"
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleScope(s.id)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] text-foreground">
                                {s.id}
                              </span>
                              {s.destructive ? (
                                <span className="rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] text-destructive uppercase tracking-[0.2em]">
                                  Destructive
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 text-muted-foreground text-xs">
                              {s.description}
                            </p>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-1.5">
          <Label htmlFor="key-expiry">Expires after</Label>
          <ExpirySelect value={expiry} onChange={setExpiry} />
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span aria-live="polite" className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em]">
            {scopes.size} scope{scopes.size === 1 ? "" : "s"} selected
          </span>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <Button variant="ghost" size="sm" type="button" className="pointer-coarse:h-11">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim() || scopes.size === 0}
              className="pointer-coarse:h-11"
            >
              Generate key
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ExpirySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        id="key-expiry"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-lg pointer-coarse:h-11 border border-input bg-background pl-3 pr-9 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24"
      >
        <option value="7">7 days</option>
        <option value="30">30 days</option>
        <option value="90">90 days</option>
        <option value="365">1 year</option>
        <option value="never">Never</option>
      </select>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 opacity-60"
      >
        <polyline points="4 6 8 10 12 6" />
      </svg>
    </div>
  );
}
