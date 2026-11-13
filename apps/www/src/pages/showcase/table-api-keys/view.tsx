// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@wirefront/ui/alert-dialog";
import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@wirefront/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wirefront/ui/dropdown-menu";
import { Input } from "@wirefront/ui/input";
import { Label } from "@wirefront/ui/label";
import { cn } from "@wirefront/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@wirefront/ui/table";
import { useAction } from "@wirefront/ui/wirefront/action";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { CheckIcon, CopyIcon, EllipsisIcon, KeyIcon, PlusIcon, RotateCwIcon, TrashIcon } from "lucide-react";
import { type ReactNode, useEffect, useId, useState } from "react";

import { type ApiKey, type CreatedKey, type CreateKeyInput, KeyEnvironment, NewKeyForm } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("apiKeys.<key>"). */
export const API_KEYS_MESSAGES = {
  title: "API keys",
  subtitle: "Server-side keys never appear in client bundles.",
  warning: "Keep these keys secret: they grant API access. Rotate any key you think was exposed.",
  newKey: "New key",
  columnName: "Name",
  columnKey: "Key",
  columnScopes: "Scopes",
  columnCreated: "Created",
  columnLastUsed: "Last used",
  actions: "Actions",
  actionsFor: "Actions for {name}",
  live: "live",
  test: "test",
  never: "Never",
  expires: "Expires {date}",
  lastUsed: "Last used {when}",
  rotate: "Rotate key",
  revoke: "Revoke",
  revokeTitle: "Revoke {name}?",
  revokeDescription: "Anything using this key stops working straight away. This can’t be undone.",
  rotateTitle: "Rotate {name}?",
  rotateDescription: "You get a new secret and the current one stops working. Update everywhere it’s used.",
  cancel: "Cancel",
  emptyTitle: "No API keys yet",
  emptyDescription: "Create a key to call the API from your servers.",
  errorTitle: "Couldn’t load API keys",
  retry: "Try again",
  createTitle: "Create an API key",
  createDescription: "Name it after where it’s used, so you know what breaks if you revoke it.",
  name: "Name",
  namePlaceholder: "e.g. Production server",
  environment: "Environment",
  scopes: "Scopes",
  create: "Create key",
  secretTitle: "Copy your new key",
  secretDescription: "This is the only time you’ll see the full key. Store it somewhere safe, like your secrets manager.",
  copy: "Copy key",
  copied: "Copied",
  done: "Done",
};

export interface ApiKeysTableProps {
  keys: ApiKey[];
  /** "loading" shows skeleton rows; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Scopes a new key can have. */
  availableScopes: string[];
  /** Create a key; resolve with it and its secret, which is shown once. The New key button only shows when given. */
  onCreate?: Action<CreateKeyInput, CreatedKey>;
  /** Replace a key's secret (receives its id); resolve with the new secret, which is shown once. */
  onRotate?: Action<string, CreatedKey>;
  /** Revoke a key (receives its id), after the user confirms. */
  onRevoke?: Action<string>;
  className?: string;
}

const SKELETON_ROWS = ["s1", "s2", "s3", "s4"];
const masked = (k: ApiKey) => `${k.prefix}••••${k.last4}`;

export function ApiKeysTable({ keys, status = "ready", error, onRetry, availableScopes, onCreate, onRotate, onRevoke, className }: ApiKeysTableProps) {
  const t = useMessages("apiKeys", API_KEYS_MESSAGES);
  const format = useFormat();
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: "rotate" | "revoke"; key: ApiKey } | null>(null);
  const [secret, setSecret] = useState<CreatedKey | null>(null);
  const [revoked, setRevoked] = useState<ReadonlySet<string>>(new Set());

  const rotate = useAction(onRotate ?? (async () => {}), { onSuccess: (created) => created && setSecret(created) });
  const revoke = useAction(onRevoke ?? (async () => {}), { onSuccess: (_, id) => setRevoked((r) => new Set(r).add(id)) });
  const actionError = rotate.error ?? revoke.error;
  const rows = keys.filter((k) => !revoked.has(k.id));
  const day = (iso: string) => format.date(iso, { dateStyle: "medium" });

  const message = (title: string, description?: string, action?: ReactNode) => (
    <TableRow>
      <TableCell className="whitespace-normal py-12 text-center" colSpan={6}>
        <p className="font-medium">{title}</p>
        {description ? <p className="mt-1 text-muted-foreground text-sm">{description}</p> : null}
        {action}
      </TableCell>
    </TableRow>
  );

  let body: ReactNode;
  if (status === "loading") {
    body = SKELETON_ROWS.map((key) => (
      <TableRow key={key}>
        <TableCell className="ps-4" colSpan={6}>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </TableCell>
      </TableRow>
    ));
  } else if (status === "error") {
    body = message(
      t.errorTitle,
      error,
      onRetry ? (
        <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
          {t.retry}
        </Button>
      ) : null,
    );
  } else if (rows.length === 0) {
    body = message(t.emptyTitle, t.emptyDescription);
  } else {
    body = rows.map((k) => {
      const lastUsed = k.lastUsedAt ? format.relative(k.lastUsedAt) : t.never;
      const pending = rotate.isPending(k.id) || revoke.isPending(k.id);
      return (
        <TableRow aria-busy={pending || undefined} className={cn(pending && "opacity-60")} key={k.id}>
          <TableCell className="w-full max-w-0 ps-4 sm:w-auto sm:max-w-none">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium">{k.name}</span>
              <Badge
                className={cn(
                  "h-4.5 shrink-0 rounded-sm px-1 font-mono text-[10px] uppercase",
                  k.env === "live" ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400" : "border-violet-500/30 text-violet-700 dark:text-violet-400",
                )}
                variant="outline"
              >
                {t[k.env]}
              </Badge>
            </div>
            <div className="mt-0.5 truncate font-mono text-muted-foreground text-xs sm:hidden">{masked(k)}</div>
            {k.expiresAt ? <div className="text-amber-700 text-xs dark:text-amber-400">{interpolate(t.expires, { date: day(k.expiresAt) })}</div> : null}
            <div className="mt-1 text-muted-foreground text-xs max-sm:hidden md:hidden">{interpolate(t.lastUsed, { when: lastUsed })}</div>
          </TableCell>
          <TableCell className="max-sm:hidden">
            <code className="inline-flex max-w-full rounded-md border bg-background px-2 py-1 font-mono text-muted-foreground text-xs">{masked(k)}</code>
          </TableCell>
          <TableCell className="max-lg:hidden">
            <div className="flex flex-wrap gap-1">
              {k.scopes.map((s) => (
                <Badge className="h-4.5 rounded-sm px-1 font-mono text-[10px]" key={s} variant="outline">
                  {s}
                </Badge>
              ))}
            </div>
          </TableCell>
          <TableCell className="text-muted-foreground tabular-nums max-lg:hidden">{day(k.createdAt)}</TableCell>
          <TableCell className="text-muted-foreground max-md:hidden">{lastUsed}</TableCell>
          <TableCell className="pe-2 sm:pe-4">
            {onRotate || onRevoke ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button aria-label={interpolate(t.actionsFor, { name: k.name })} className="pointer-coarse:size-11" size="icon" variant="ghost" />}
                >
                  {pending ? <Spinner /> : <EllipsisIcon />}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onRotate ? (
                    <DropdownMenuItem onClick={() => setConfirm({ kind: "rotate", key: k })}>
                      <RotateCwIcon /> {t.rotate}
                    </DropdownMenuItem>
                  ) : null}
                  {onRotate && onRevoke ? <DropdownMenuSeparator /> : null}
                  {onRevoke ? (
                    <DropdownMenuItem onClick={() => setConfirm({ kind: "revoke", key: k })} variant="destructive">
                      <TrashIcon /> {t.revoke}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </TableCell>
        </TableRow>
      );
    });
  }

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12", className)}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-2 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 font-heading text-xl">
              <KeyIcon className="size-5 text-muted-foreground" />
              {t.title}
            </h1>
            <p className="text-muted-foreground text-sm">{t.subtitle}</p>
          </div>
          {onCreate ? (
            <Button className="shrink-0 pointer-coarse:h-10" onClick={() => setCreating(true)} size="sm">
              <PlusIcon />
              {t.newKey}
            </Button>
          ) : null}
        </header>

        <p className="mb-6 max-w-prose rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-amber-800 text-xs dark:text-amber-300">{t.warning}</p>

        {actionError ? (
          <p className="mb-3 text-destructive-foreground text-sm" role="alert">
            {actionError}
          </p>
        ) : null}

        <div className="rounded-xl border bg-card shadow-xs/5">
          <Table aria-busy={status === "loading"}>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4">{t.columnName}</TableHead>
                <TableHead className="max-sm:hidden">{t.columnKey}</TableHead>
                <TableHead className="max-lg:hidden">{t.columnScopes}</TableHead>
                <TableHead className="max-lg:hidden">{t.columnCreated}</TableHead>
                <TableHead className="max-md:hidden">{t.columnLastUsed}</TableHead>
                <TableHead className="w-px pe-4">
                  <span className="sr-only">{t.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{body}</TableBody>
          </Table>
        </div>
      </div>

      {onCreate ? (
        <CreateKeyDialog
          availableScopes={availableScopes}
          onCreate={onCreate}
          onCreated={(created) => {
            setCreating(false);
            if (created) setSecret(created);
          }}
          onOpenChange={setCreating}
          open={creating}
          t={t}
        />
      ) : null}

      <AlertDialog onOpenChange={(open) => !open && setConfirm(null)} open={confirm !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm ? interpolate(confirm.kind === "revoke" ? t.revokeTitle : t.rotateTitle, { name: confirm.key.name }) : null}
            </AlertDialogTitle>
            <AlertDialogDescription>{confirm?.kind === "rotate" ? t.rotateDescription : t.revokeDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <Button
              className={confirm?.kind === "revoke" ? "text-destructive-foreground" : undefined}
              onClick={() => {
                if (!confirm) return;
                const { id } = confirm.key;
                void (confirm.kind === "revoke" ? revoke.run(id, id) : rotate.run(id, id));
                setConfirm(null);
              }}
              variant={confirm?.kind === "revoke" ? "destructive" : "default"}
            >
              {confirm?.kind === "rotate" ? t.rotate : t.revoke}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SecretDialog created={secret} onClose={() => setSecret(null)} t={t} />
    </div>
  );
}

type Messages = typeof API_KEYS_MESSAGES;

function CreateKeyDialog({
  open,
  onOpenChange,
  onCreate,
  onCreated,
  availableScopes,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: Action<CreateKeyInput, CreatedKey>;
  onCreated: (created: CreatedKey | undefined) => void;
  availableScopes: string[];
  t: Messages;
}) {
  const id = useId();
  const [env, setEnv] = useState<KeyEnvironment>("live");
  const [scopes, setScopes] = useState<string[]>([]);
  const form = useActionForm({
    schema: NewKeyForm,
    action: ({ name }) => onCreate({ name, env, scopes }),
    onSuccess: (created) => {
      setScopes([]);
      onCreated(created);
    },
  });
  const label = "font-medium text-sm";
  return (
    <Dialog
      onOpenChange={(next) => {
        if (form.pending) return;
        if (!next) form.reset();
        onOpenChange(next);
      }}
      open={open}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.createTitle}</DialogTitle>
          <DialogDescription>{t.createDescription}</DialogDescription>
        </DialogHeader>
        <Form className="flex flex-col gap-4" noValidate {...form.formProps}>
          <Field.Root className="flex flex-col gap-2" name="name">
            <Field.Label className={label}>{t.name}</Field.Label>
            <Input autoComplete="off" placeholder={t.namePlaceholder} />
            <Field.Error className="text-destructive-foreground text-xs" />
          </Field.Root>
          <div className="flex flex-col gap-2">
            <Label className={label} htmlFor={`${id}-env`}>
              {t.environment}
            </Label>
            <Select items={KeyEnvironment.options.map((e) => ({ label: t[e], value: e }))} onValueChange={(v) => setEnv(v as KeyEnvironment)} value={env}>
              <SelectTrigger className="w-full" id={`${id}-env`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KeyEnvironment.options.map((e) => (
                  <SelectItem key={e} value={e}>
                    {t[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className={cn(label, "mb-2")}>{t.scopes}</legend>
            {availableScopes.map((scope) => (
              <div className="flex items-center gap-2" key={scope}>
                <Checkbox
                  checked={scopes.includes(scope)}
                  id={`${id}-scope-${scope}`}
                  onCheckedChange={(on) => setScopes((all) => (on ? [...all, scope] : all.filter((s) => s !== scope)))}
                />
                <Label className="font-mono font-normal text-sm" htmlFor={`${id}-scope-${scope}`}>
                  {scope}
                </Label>
              </div>
            ))}
          </fieldset>
          {form.formError ? (
            <p className="text-destructive-foreground text-xs" role="alert">
              {form.formError}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose disabled={form.pending} render={<Button type="button" variant="ghost" />}>
              {t.cancel}
            </DialogClose>
            <Button aria-busy={form.pending} disabled={form.pending || scopes.length === 0} type="submit">
              {form.pending ? <Spinner data-icon="inline-start" /> : null}
              {t.create}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SecretDialog({ created, onClose, t }: { created: CreatedKey | null; onClose: () => void; t: Messages }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={created !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.secretTitle}</DialogTitle>
          <DialogDescription>{t.secretDescription}</DialogDescription>
        </DialogHeader>
        <code className="break-all rounded-md border bg-muted/40 p-3 font-mono text-sm">{created?.secret}</code>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!created) return;
              void navigator.clipboard?.writeText(created.secret).then(() => setCopied(true));
            }}
            type="button"
            variant="outline"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? t.copied : t.copy}
          </Button>
          <DialogClose render={<Button type="button" />}>{t.done}</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
