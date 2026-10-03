import { useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  EllipsisIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  PlusIcon,
  RotateCwIcon,
  TrashIcon,
} from "lucide-react";
import { Badge } from "@orbit/ui/badge";
import { Button } from "@orbit/ui/button";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@orbit/ui/menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@orbit/ui/table";

interface ApiKey {
  name: string;
  prefix: string;
  scopes: string[];
  created: string;
  lastUsed: string;
  env: "live" | "test";
  expires?: string;
}

const KEYS: ApiKey[] = [
  { name: "Production server", prefix: "sk_live_8f4ad…91c2", scopes: ["read", "write"], created: "Jan 12, 2026", lastUsed: "2 minutes ago", env: "live" },
  { name: "Webhook receiver", prefix: "sk_live_220bc…77fd", scopes: ["events.write"], created: "Mar 03, 2026", lastUsed: "14 hours ago", env: "live", expires: "Jul 03, 2026" },
  { name: "CI / Vercel", prefix: "sk_live_e1d12…3a04", scopes: ["read"], created: "Mar 28, 2026", lastUsed: "3 days ago", env: "live" },
  { name: "Local dev — Sean", prefix: "sk_test_aabc8…1d44", scopes: ["read", "write", "admin"], created: "Apr 18, 2026", lastUsed: "Just now", env: "test" },
  { name: "Mobile staging", prefix: "sk_test_44910…f2bc", scopes: ["read"], created: "Apr 02, 2026", lastUsed: "Never", env: "test" },
];

export function TableApiKeysShowcasePage() {
  const [revealed, setRevealed] = useState<string | null>(null);
  return (
    <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-2 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 font-heading text-xl">
              <KeyIcon className="size-5 text-muted-foreground" />
              API keys
            </h1>
            <p className="text-muted-foreground text-sm">
              Server-side keys never appear in client bundles.
            </p>
          </div>
          <Button size="sm" className="shrink-0 pointer-coarse:h-10">
            <PlusIcon />
            New key
          </Button>
        </header>

        <p className="mb-6 max-w-prose rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-amber-700 text-xs dark:text-amber-300">
          Keep these keys secret — they grant full API access. Rotate any key suspected of being exposed.
        </p>

        {/*
          Phones: one uniform two-line row per key — name + env, then a short
          masked key — with copy, reveal and ⋯ (rotate / scopes / revoke) on
          the right. The full key pill returns at sm, Last used at md, Created
          and Scopes at lg.
        */}
        <div className="rounded-xl border bg-card shadow-xs/5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4">Name</TableHead>
                <TableHead className="max-sm:hidden">Key</TableHead>
                <TableHead className="max-lg:hidden">Scopes</TableHead>
                <TableHead className="max-lg:hidden">Created</TableHead>
                <TableHead className="max-md:hidden">Last used</TableHead>
                <TableHead className="pe-4 w-px">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {KEYS.map((k) => (
                <TableRow key={k.prefix}>
                  <TableCell className="w-full max-w-0 ps-4 sm:w-auto sm:max-w-none">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium">{k.name}</span>
                      <Badge
                        variant="outline"
                        size="sm"
                        className={
                          "shrink-0 font-mono text-[10px] uppercase " +
                          (k.env === "live"
                            ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                            : "border-violet-500/30 text-violet-700 dark:text-violet-400")
                        }
                      >
                        {k.env}
                      </Badge>
                    </div>
                    <div className="mt-0.5 truncate font-mono text-muted-foreground text-xs sm:hidden">
                      {revealed === k.prefix ? k.prefix : shortKey(k.prefix)}
                      {k.expires ? (
                        <span className="text-amber-600 dark:text-amber-400"> · exp {k.expires.replace(/, \d{4}$/, "")}</span>
                      ) : null}
                    </div>
                    {k.expires ? (
                      <div className="text-amber-600 text-xs max-sm:hidden dark:text-amber-400">
                        Expires {k.expires}
                      </div>
                    ) : null}
                    <div className="mt-1 text-muted-foreground text-xs max-sm:hidden md:hidden">
                      Last used {k.lastUsed.toLowerCase()}
                    </div>
                  </TableCell>
                  <TableCell className="max-sm:hidden">
                    <KeyPill
                      k={k}
                      revealed={revealed === k.prefix}
                      onReveal={() => setRevealed((r) => (r === k.prefix ? null : k.prefix))}
                    />
                  </TableCell>
                  <TableCell className="max-lg:hidden">
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          size="sm"
                          className="font-mono text-[10px]"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums max-lg:hidden">
                    {k.created}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-md:hidden">{k.lastUsed}</TableCell>
                  <TableCell className="pe-2 sm:pe-4">
                    <div className="flex items-center justify-end gap-0.5">
                    <span className="contents sm:hidden">
                      <KeyActions
                        k={k}
                        revealed={revealed === k.prefix}
                        onReveal={() => setRevealed((r) => (r === k.prefix ? null : k.prefix))}
                      />
                    </span>
                    <Menu>
                      <MenuTrigger
                        render={<Button variant="ghost" size="icon" aria-label={`Actions for ${k.name}`} className="pointer-coarse:size-11" />}
                      >
                        <EllipsisIcon />
                      </MenuTrigger>
                      <MenuPopup align="end">
                        <MenuItem>
                          <RotateCwIcon /> Rotate key
                        </MenuItem>
                        <MenuItem>Edit scopes</MenuItem>
                        <MenuSeparator />
                        <MenuItem variant="destructive">
                          <TrashIcon /> Revoke
                        </MenuItem>
                      </MenuPopup>
                    </Menu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// "sk_live_8f4ad…91c2" → "sk_live_••••91c2": the usual masked form, short
// enough to fit on phones with the actions beside it.
function shortKey(prefix: string) {
  const [head] = prefix.split("…");
  const last = prefix.slice(-4);
  return `${head!.split("_").slice(0, 2).join("_")}_••••${last}`;
}

function KeyActions({
  k,
  revealed,
  onReveal,
}: {
  k: (typeof KEYS)[number];
  revealed: boolean;
  onReveal: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="size-8 shrink-0 pointer-coarse:size-10"
        aria-label={revealed ? `Hide ${k.name} key` : `Reveal ${k.name} key`}
        aria-pressed={revealed}
        onClick={onReveal}
      >
        {revealed ? <EyeOffIcon className="!size-3.5" /> : <EyeIcon className="!size-3.5" />}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-8 shrink-0 pointer-coarse:size-10"
        aria-label={copied ? "Copied" : `Copy ${k.name} key`}
        onClick={() => {
          void navigator.clipboard?.writeText(k.prefix).catch(() => {});
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? (
          <CheckIcon className="!size-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <CopyIcon className="!size-3.5" />
        )}
      </Button>
    </>
  );
}

function KeyPill({
  k,
  revealed,
  onReveal,
}: {
  k: (typeof KEYS)[number];
  revealed: boolean;
  onReveal: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const masked = shortKey(k.prefix).replace("••••", "••••••••••••");
  return (
    <div className="inline-flex max-w-full items-center gap-1 rounded-md border bg-background px-2 py-1 font-mono text-xs">
      <span className="truncate text-muted-foreground">{revealed ? k.prefix : masked}</span>
      <Button
        size="icon"
        variant="ghost"
        className="-mr-1 size-6 shrink-0 pointer-coarse:size-9"
        aria-label={revealed ? `Hide ${k.name} key` : `Reveal ${k.name} key`}
        aria-pressed={revealed}
        onClick={onReveal}
      >
        {revealed ? <EyeOffIcon className="!size-3" /> : <EyeIcon className="!size-3" />}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-6 shrink-0 pointer-coarse:size-9"
        aria-label={copied ? "Copied" : `Copy ${k.name} key`}
        onClick={() => {
          void navigator.clipboard?.writeText(k.prefix).catch(() => {});
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? (
          <CheckIcon className="!size-3 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <CopyIcon className="!size-3" />
        )}
      </Button>
    </div>
  );
}
