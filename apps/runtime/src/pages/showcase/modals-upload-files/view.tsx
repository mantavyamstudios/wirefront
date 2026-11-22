// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Progress } from "@base-ui/react/progress";
import { Button } from "@wirefront/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@wirefront/ui/dialog";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
} from "@wirefront/ui/wirefront/provider";
import {
  CheckIcon,
  CloudUploadIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  PlayIcon,
  RotateCwIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";

import type { UploadItem, UploadState } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("uploadDialog.<key>"). */
export const UPLOAD_DIALOG_MESSAGES = {
  pageTitle: "Assets",
  trigger: "Upload",
  title: "Upload files",
  dropZone: "Upload files",
  drop: "Drag and drop files here, or",
  browse: "browse",
  tap: "Tap to choose files",
  limits: "Up to {size} MB · {types}",
  tooLarge: "{name} is larger than {size} MB.",
  complete: "{done} of {total} complete",
  overall: "Overall upload progress",
  fileProgress: "{name} progress",
  uploaded: "{name} uploaded",
  cancel: "Cancel {name}",
  resume: "Resume {name}",
  retry: "Retry {name}",
  cancelAll: "Cancel all",
  done: "Done",
};

export interface UploadDialogProps {
  /** The upload queue, as your uploader reports it. Update it as files progress. */
  uploads: UploadItem[];
  /** Start uploading files the user picked, dropped or pasted. */
  onAddFiles: (files: File[]) => void;
  /** Cancel one upload. The button hides without it. */
  onCancel?: (id: string) => void;
  /** Resume a paused upload, or retry a failed one. The button hides without it. */
  onResume?: (id: string) => void;
  /** Cancel everything still in flight. Hidden without it. */
  onCancelAll?: () => void;
  /** Which files the picker offers, e.g. "image/*,.pdf". */
  accept?: string;
  /** What the drop zone says is accepted, e.g. "png, jpg, pdf". */
  typesLabel: string;
  maxSizeMb?: number;
  /** The page behind the dialog, e.g. "Assets · Brand". */
  pageTitle?: string;
  /** Open the dialog on first render. */
  defaultOpen?: boolean;
  className?: string;
}

const BAR: Record<UploadState, string> = {
  uploading: "bg-foreground",
  paused: "bg-category-3",
  done: "bg-category-2",
  failed: "bg-destructive",
};

function glyph(name: string) {
  if (/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(name)) return ImageIcon;
  if (/\.(pdf|docx?|txt|md|fig|key|pptx?)$/i.test(name)) return FileTextIcon;
  return FileIcon;
}

function UploadDialogScreen({
  uploads,
  onAddFiles,
  onCancel,
  onResume,
  onCancelAll,
  accept,
  typesLabel,
  maxSizeMb = 250,
  pageTitle,
  defaultOpen,
  className,
}: UploadDialogProps) {
  const t = useMessages("uploadDialog", UPLOAD_DIALOG_MESSAGES);
  const format = useFormat();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [problem, setProblem] = useState<string>();
  const done = uploads.filter((u) => u.state === "done").length;
  const overall = uploads.length
    ? Math.round(uploads.reduce((n, u) => n + u.progress, 0) / uploads.length)
    : 0;
  const inFlight = uploads.some(
    (u) => u.state === "uploading" || u.state === "paused"
  );
  const size = (bytes: number) =>
    format.number(bytes / 1024 / 1024, {
      style: "unit",
      unit: "megabyte",
      maximumFractionDigits: 1,
    });

  const add = (list: FileList | null) => {
    const files = [...(list ?? [])];
    if (!files.length) return;
    const big = files.find((f) => f.size > maxSizeMb * 1024 * 1024);
    if (big) {
      setProblem(interpolate(t.tooLarge, { name: big.name, size: maxSizeMb }));
      return;
    }
    setProblem(undefined);
    onAddFiles(files);
  };

  return (
    // Real Dialog (focus trap, Esc, scroll lock); bottom sheet on phones.
    <div className={cn("relative min-h-svh bg-background", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-10 sm:py-10">
        <h1 className="font-heading text-2xl">{pageTitle ?? t.pageTitle}</h1>
        <Dialog defaultOpen={defaultOpen}>
          <DialogTrigger render={<Button />}>
            <CloudUploadIcon />
            {t.trigger}
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-base">{t.title}</DialogTitle>
            </DialogHeader>

            <div className="-mx-4 min-h-0 min-w-0 overflow-y-auto px-4">
              <section
                aria-label={t.dropZone}
                className={cn(
                  "rounded-xl border-2 border-dashed bg-background px-6 py-8 text-center transition-colors",
                  over
                    ? "border-primary/60 bg-primary/4"
                    : "border-border/70 hover:border-foreground/40"
                )}
                onDragLeave={() => setOver(false)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(true);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(false);
                  add(e.dataTransfer.files);
                }}
                onPaste={(e) => add(e.clipboardData.files)}
              >
                <input
                  accept={accept}
                  aria-label={t.dropZone}
                  className="sr-only"
                  multiple
                  onChange={(e) => {
                    add(e.target.files);
                    e.target.value = "";
                  }}
                  ref={input}
                  tabIndex={-1}
                  type="file"
                />
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-foreground/6">
                  <CloudUploadIcon aria-hidden className="size-5 opacity-70" />
                </div>
                {/* Drag-and-drop copy only where a pointer can drag. */}
                <div className="mt-3 text-sm">
                  <span className="pointer-coarse:hidden">
                    {t.drop}{" "}
                    <button
                      className="rounded-sm text-foreground underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => input.current?.click()}
                      type="button"
                    >
                      {t.browse}
                    </button>
                  </span>
                  <button
                    className="hidden min-h-11 text-foreground pointer-coarse:inline"
                    onClick={() => input.current?.click()}
                    type="button"
                  >
                    {t.tap}
                  </button>
                </div>
                <div className="mt-1 text-muted-foreground text-xs">
                  {interpolate(t.limits, {
                    size: maxSizeMb,
                    types: typesLabel,
                  })}
                </div>
              </section>
              {problem ? (
                <p
                  className="mt-2 text-destructive-foreground text-sm"
                  role="alert"
                >
                  {problem}
                </p>
              ) : null}

              {uploads.length ? (
                <div className="mt-4">
                  <Progress.Root aria-label={t.overall} value={overall}>
                    <div className="mb-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                      <span aria-live="polite">
                        {interpolate(t.complete, {
                          done,
                          total: uploads.length,
                        })}
                      </span>
                      <Progress.Value />
                    </div>
                    <Progress.Track className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <Progress.Indicator className="h-full bg-foreground transition-[width] motion-reduce:transition-none" />
                    </Progress.Track>
                  </Progress.Root>

                  <ul className="mt-4 flex flex-col gap-2.5">
                    {uploads.map((u) => {
                      const Icon = glyph(u.name);
                      const action =
                        u.state === "done"
                          ? null
                          : (u.state === "paused" || u.state === "failed") &&
                              onResume
                            ? {
                                label: interpolate(
                                  u.state === "failed" ? t.retry : t.resume,
                                  { name: u.name }
                                ),
                                run: () => onResume(u.id),
                                icon:
                                  u.state === "failed"
                                    ? RotateCwIcon
                                    : PlayIcon,
                              }
                            : u.state === "uploading" && onCancel
                              ? {
                                  label: interpolate(t.cancel, {
                                    name: u.name,
                                  }),
                                  run: () => onCancel(u.id),
                                  icon: XIcon,
                                }
                              : null;
                      return (
                        <li
                          className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2.5"
                          key={u.id}
                        >
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground/6">
                            <Icon aria-hidden className="size-4 opacity-70" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="truncate text-sm">{u.name}</span>
                              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                                {size(u.size)}
                              </span>
                            </div>
                            <Progress.Root
                              aria-label={interpolate(t.fileProgress, {
                                name: u.name,
                              })}
                              className="mt-1.5"
                              value={u.progress}
                            >
                              <Progress.Track className="h-1 w-full overflow-hidden rounded-full bg-muted">
                                <Progress.Indicator
                                  className={cn(
                                    "h-full transition-[width] motion-reduce:transition-none",
                                    BAR[u.state]
                                  )}
                                />
                              </Progress.Track>
                            </Progress.Root>
                            {u.state === "failed" && u.error ? (
                              <p className="mt-1 text-destructive-foreground text-xs">
                                {u.error}
                              </p>
                            ) : null}
                          </div>
                          {u.state === "done" ? (
                            <span
                              aria-label={interpolate(t.uploaded, {
                                name: u.name,
                              })}
                              className="grid size-7 shrink-0 place-items-center pointer-coarse:size-10"
                              role="img"
                            >
                              <CheckIcon className="size-3.5 text-category-2-foreground" />
                            </span>
                          ) : action ? (
                            <button
                              aria-label={action.label}
                              className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground pointer-coarse:size-10"
                              onClick={action.run}
                              type="button"
                            >
                              <action.icon className="size-3.5" />
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              {onCancelAll && inFlight ? (
                <Button onClick={onCancelAll} type="button" variant="ghost">
                  {t.cancelAll}
                </Button>
              ) : null}
              <DialogClose render={<Button type="button" />}>
                {t.done}
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function UploadDialog(props: UploadDialogProps) {
  return (
    <ScreenBoundary name="UploadDialog">
      <UploadDialogScreen {...props} />
    </ScreenBoundary>
  );
}
