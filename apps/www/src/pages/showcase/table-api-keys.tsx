import {
  CopyIcon,
  EllipsisIcon,
  EyeIcon,
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
          Priority columns: phones see Name (masked key + last used folded in)
          and actions; Key returns at sm, Last used at md, Created and Scopes at lg.
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
                    <div className="flex items-center gap-2">
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
                    {k.expires ? (
                      <div className="text-amber-600 text-xs dark:text-amber-400">
                        Expires {k.expires}
                      </div>
                    ) : null}
                    <div className="mt-1.5 sm:hidden">
                      <KeyPill k={k} />
                    </div>
                    <div className="mt-1 text-muted-foreground text-xs md:hidden">
                      Last used {k.lastUsed.toLowerCase()}
                    </div>
                  </TableCell>
                  <TableCell className="max-sm:hidden">
                    <KeyPill k={k} />
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
                  <TableCell className="pe-4">
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

function KeyPill({ k }: { k: (typeof KEYS)[number] }) {
  return (
    <div className="inline-flex max-w-full items-center gap-1 rounded-md border bg-background px-2 py-1 font-mono text-xs">
      <span className="truncate text-muted-foreground">{k.prefix}</span>
      <Button
        size="icon"
        variant="ghost"
        className="-mr-1 size-6 shrink-0 pointer-coarse:size-9"
        aria-label={`Reveal ${k.name} key`}
      >
        <EyeIcon className="!size-3" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-6 shrink-0 pointer-coarse:size-9"
        aria-label={`Copy ${k.name} key`}
      >
        <CopyIcon className="!size-3" />
      </Button>
    </div>
  );
}
