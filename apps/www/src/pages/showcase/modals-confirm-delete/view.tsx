// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@wirefront/ui/alert-dialog";
import { Button } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { useId, useState } from "react";

import type { WorkspaceSummary } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("confirmDelete.<key>"). */
export const CONFIRM_DELETE_MESSAGES = {
  eyebrow: "Settings · Workspace",
  title: "Danger zone",
  rowTitle: "Delete workspace",
  rowDescription: "Permanently remove this workspace and all data. This cannot be undone.",
  trigger: "Delete workspace",
  dialogTitle: "Delete {slug} workspace?",
  impact: "This permanently deletes {projects}, {documents}, and revokes access for {members}.",
  projectsOne: "{count} project",
  projectsOther: "{count} projects",
  documentsOne: "{count} document",
  documentsOther: "{count} documents",
  membersOne: "{count} member",
  membersOther: "{count} members",
  backups: "Backups retained for {days} days.",
  confirmBefore: "Type",
  confirmAfter: "to confirm.",
  phrase: "delete {slug}",
  cancel: "Cancel",
  confirm: "Delete forever",
};

export interface ConfirmDeleteProps {
  /** What will be deleted, with the counts the dialog spells out. */
  workspace: WorkspaceSummary;
  /** Delete the workspace (receives its id). Resolve with nothing on success; `fail(message)` or throw to show an error. */
  onDelete: Action<string>;
  /** Called after deletion, e.g. to navigate away. */
  onDeleted?: () => void;
  /** Open the dialog on first render. */
  defaultOpen?: boolean;
  className?: string;
}

function ConfirmDeleteScreen({ workspace, onDelete, onDeleted, defaultOpen, className }: ConfirmDeleteProps) {
  const t = useMessages("confirmDelete", CONFIRM_DELETE_MESSAGES);
  const { locale } = useWirefront();
  const format = useFormat();
  const id = useId();
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [value, setValue] = useState("");
  const remove = useAction(onDelete, {
    onSuccess: () => {
      setOpen(false);
      onDeleted?.();
    },
  });

  const phrase = interpolate(t.phrase, { slug: workspace.slug });
  const plurals = new Intl.PluralRules(locale);
  const count = (n: number, one: string, other: string) =>
    interpolate(plurals.select(n) === "one" ? one : other, { count: format.number(n) });
  const busy = remove.isPending();

  return (
    <div className={cn("relative min-h-svh bg-background", className)}>
      <div className="px-4 py-8 sm:px-10 sm:py-10">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
        <div className="mt-6 flex max-w-xl flex-col gap-3 rounded-xl border border-border/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm">{t.rowTitle}</div>
            <div className="mt-1 text-muted-foreground text-xs">{t.rowDescription}</div>
          </div>
          <AlertDialog
            onOpenChange={(next) => {
              if (busy) return;
              setOpen(next);
              if (!next) setValue("");
            }}
            open={open}
          >
            <AlertDialogTrigger render={<Button className="shrink-0 self-start text-destructive-foreground sm:self-auto" size="sm" variant="destructive" />}>
              <Trash2Icon />
              {t.trigger}
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader className="sm:flex-row sm:items-start sm:gap-3">
                <div className="mx-auto flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive sm:mx-0">
                  <TriangleAlertIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <AlertDialogTitle>{interpolate(t.dialogTitle, { slug: workspace.slug })}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {interpolate(t.impact, {
                      projects: count(workspace.projects, t.projectsOne, t.projectsOther),
                      documents: count(workspace.documents, t.documentsOne, t.documentsOther),
                      members: count(workspace.members, t.membersOne, t.membersOther),
                    })}
                    {workspace.backupDays ? ` ${interpolate(t.backups, { days: workspace.backupDays })}` : null}
                  </AlertDialogDescription>
                </div>
              </AlertDialogHeader>

              <div className="mx-6 mb-5 rounded-lg border border-border/60 bg-background p-3 text-xs">
                <label className="text-muted-foreground" htmlFor={`${id}-phrase`}>
                  {t.confirmBefore} <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{phrase}</span>{" "}
                  {t.confirmAfter}
                </label>
                <Input
                  autoCapitalize="none"
                  autoComplete="off"
                  className="mt-2 font-mono"
                  disabled={busy}
                  id={`${id}-phrase`}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={phrase}
                  spellCheck={false}
                  value={value}
                />
                {remove.error ? (
                  <p className="mt-2 text-destructive-foreground" role="alert">
                    {remove.error}
                  </p>
                ) : null}
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy} render={<Button type="button" variant="ghost" />}>
                  {t.cancel}
                </AlertDialogCancel>
                <Button
                  aria-busy={busy}
                  disabled={value !== phrase || busy}
                  onClick={() => void remove.run(workspace.id)}
                  className="text-destructive-foreground"
                  type="button"
                  variant="destructive"
                >
                  {busy ? <Spinner data-icon="inline-start" /> : <Trash2Icon />}
                  {t.confirm}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDelete(props: ConfirmDeleteProps) {
  return (
    <ScreenBoundary name="ConfirmDelete">
      <ConfirmDeleteScreen {...props} />
    </ScreenBoundary>
  );
}
