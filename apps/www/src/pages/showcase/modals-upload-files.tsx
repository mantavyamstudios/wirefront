import {
  CheckIcon,
  CloudUploadIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  PauseIcon,
  XIcon,
} from "lucide-react";
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

interface UploadFile {
  name: string;
  size: string;
  progress: number;
  state: "uploading" | "done" | "paused";
  kind: "image" | "doc" | "file";
}

const FILES: UploadFile[] = [
  { name: "brand-system-2026.fig", size: "12.4 MB", progress: 100, state: "done", kind: "doc" },
  { name: "homepage-hero.png", size: "2.8 MB", progress: 76, state: "uploading", kind: "image" },
  { name: "annual-report.pdf", size: "8.1 MB", progress: 42, state: "uploading", kind: "doc" },
  { name: "moodboard-04.zip", size: "144 MB", progress: 12, state: "paused", kind: "file" },
];

export function ModalsUploadFilesShowcasePage() {
  const total = FILES.length;
  const done = FILES.filter((f) => f.state === "done").length;
  const overall = Math.round(
    FILES.reduce((acc, f) => acc + f.progress, 0) / total,
  );

  return (
    // Real Dialog (focus trap, Esc, scroll lock); bottom sheet on phones.
    <div className="relative min-h-svh bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-10 sm:py-10">
        <div className="font-heading text-2xl">Assets · Brand</div>
      <Dialog defaultOpen>
        <DialogTrigger render={<Button />}>
          <CloudUploadIcon />
          Upload
        </DialogTrigger>
        <DialogPopup className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base">Upload assets</DialogTitle>
          </DialogHeader>

          <DialogPanel>
            <label className="block cursor-pointer rounded-xl border-2 border-dashed border-border/70 bg-background px-6 py-8 text-center transition-colors hover:border-foreground/40 hover:bg-muted/60">
              <input type="file" multiple className="sr-only" />
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-foreground/[0.06]">
                <CloudUploadIcon className="size-5 opacity-70" />
              </div>
              {/* Drag-and-drop copy only where a pointer can drag. */}
              <div className="mt-3 text-sm">
                <span className="pointer-coarse:hidden">
                  Drag and drop files here, or{" "}
                  <span className="text-foreground underline-offset-2 hover:underline">
                    browse
                  </span>
                </span>
                <span className="hidden text-foreground pointer-coarse:inline">Tap to choose files</span>
              </div>
              <div className="mt-1 text-muted-foreground text-xs">
                Up to 250 MB · png, jpg, pdf, fig, zip
              </div>
            </label>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                  {done} of {total} complete
                </div>
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                  {overall}%
                </div>
              </div>
              <div
                role="progressbar"
                aria-label="Overall upload progress"
                aria-valuenow={overall}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full bg-foreground"
                  style={{ width: `${overall}%` }}
                />
              </div>

              <ul className="mt-4 flex flex-col gap-2.5">
                {FILES.map((f) => (
                  <li
                    key={f.name}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2.5"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06]">
                      <FileGlyph kind={f.kind} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm">{f.name}</span>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                          {f.size}
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`${f.name} progress`}
                        aria-valuenow={f.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted"
                      >
                        <div
                          className={
                            "h-full " +
                            (f.state === "done"
                              ? "bg-emerald-500"
                              : f.state === "paused"
                                ? "bg-amber-500"
                                : "bg-foreground")
                          }
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={
                        f.state === "done"
                          ? `${f.name} uploaded`
                          : f.state === "paused"
                            ? `Resume ${f.name}`
                            : `Cancel ${f.name}`
                      }
                      className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:size-10"
                    >
                      {f.state === "done" ? (
                        <CheckIcon className="size-3.5 text-emerald-600" />
                      ) : f.state === "paused" ? (
                        <PauseIcon className="size-3.5" />
                      ) : (
                        <XIcon className="size-3.5" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </DialogPanel>

          <DialogFooter>
            <Button variant="ghost" type="button">
              Cancel all
            </Button>
            <DialogClose render={<Button type="button" />}>Done</DialogClose>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
      </div>
    </div>
  );
}

function FileGlyph({ kind }: { kind: "image" | "doc" | "file" }) {
  if (kind === "image") return <ImageIcon className="size-4 opacity-70" />;
  if (kind === "doc") return <FileTextIcon className="size-4 opacity-70" />;
  return <FileIcon className="size-4 opacity-70" />;
}
