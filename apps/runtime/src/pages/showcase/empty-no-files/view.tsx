// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { FileTextIcon, ImageIcon, UploadCloudIcon } from "lucide-react";
import { useRef, useState } from "react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("noFiles.<key>"). */
export const NO_FILES_MESSAGES = {
  drop: "Drop files to upload",
  upload: "Upload files",
  uploading: "Uploading {count} file(s)…",
  limits: "{types} up to {size} MB.",
  paste: "Or paste from clipboard with",
  choose: "Choose files",
  tooLarge: "{name} is larger than {size} MB.",
  pickFiles: "Files to upload",
};

export interface NoFilesProps {
  /** Upload the files the user chose, dropped or pasted. Resolve when done; fail to show why. */
  onUpload: Action<File[]>;
  /** Accepted types for the file picker, e.g. "image/png,image/jpeg,application/pdf". */
  accept?: string;
  /** What to call the accepted types, e.g. "PNG, JPG, PDF". */
  typesLabel?: string;
  /** Largest file allowed, checked before uploading. */
  maxSizeMb?: number;
  className?: string;
}

function NoFilesScreen({ onUpload, accept, typesLabel = "PNG, JPG, PDF", maxSizeMb = 25, className }: NoFilesProps) {
  const t = useMessages("noFiles", NO_FILES_MESSAGES);
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [problem, setProblem] = useState("");
  const [count, setCount] = useState(0);
  const upload = useAction(onUpload);

  const send = (list: FileList | File[] | null) => {
    const files = [...(list ?? [])];
    if (!files.length || upload.isPending()) return;
    const big = files.find((f) => f.size > maxSizeMb * 1024 * 1024);
    if (big) {
      setProblem(interpolate(t.tooLarge, { name: big.name, size: maxSizeMb }));
      return;
    }
    setProblem("");
    setCount(files.length);
    void upload.run(files);
  };

  return (
    <section
      aria-label={t.pickFiles}
      className={cn(
        "relative rounded-2xl border-2 border-dashed bg-background px-6 py-16 transition-colors",
        over ? "border-primary/60 bg-primary/[0.04]" : "border-border/70 hover:border-border",
        className,
      )}
      onDragLeave={() => setOver(false)}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        send(e.dataTransfer.files);
      }}
      onPaste={(e) => send(e.clipboardData.files)}
    >
      <div className="flex flex-col items-center text-center">
        <div aria-hidden className="relative h-16 w-24">
          <div className="absolute top-2 left-1/2 flex h-14 w-10 origin-bottom -translate-x-4 -rotate-12 items-center justify-center rounded-md border border-border bg-background shadow-xs/5">
            <ImageIcon className="size-4 text-muted-foreground" />
          </div>
          <div className="absolute top-0 left-1/2 flex h-14 w-10 origin-bottom -translate-x-1/2 items-center justify-center rounded-md border border-border bg-background shadow-xs/5">
            <FileTextIcon className="size-4 text-muted-foreground" />
          </div>
          <div className="absolute top-2 left-1/2 flex h-14 w-10 origin-bottom translate-x-1 rotate-12 items-center justify-center rounded-md border border-border bg-background shadow-xs/5">
            <FileTextIcon className="size-4 text-muted-foreground" />
          </div>
        </div>
        <h2 className="mt-6 font-heading font-semibold text-xl">
          {upload.isPending() ? (
            interpolate(t.uploading, { count })
          ) : (
            <>
              <span className="pointer-coarse:hidden">{t.drop}</span>
              <span className="hidden pointer-coarse:inline">{t.upload}</span>
            </>
          )}
        </h2>
        <p className="mt-1 max-w-sm text-balance text-muted-foreground text-sm">
          {interpolate(t.limits, { types: typesLabel, size: maxSizeMb })}
          <span className="pointer-coarse:hidden">
            {" "}
            {t.paste} <Kbd>⌘V</Kbd>.
          </span>
        </p>
        <div className="mt-5 flex items-center gap-2">
          <Button disabled={upload.isPending()} onClick={() => inputRef.current?.click()}>
            {upload.isPending() ? <Spinner /> : <UploadCloudIcon />}
            {t.choose}
          </Button>
        </div>
        <input
          accept={accept}
          aria-label={t.choose}
          className="hidden"
          multiple
          onChange={(e) => {
            send(e.target.files);
            e.target.value = "";
          }}
          ref={inputRef}
          type="file"
        />
        {problem || upload.error ? (
          <p className="mt-3 text-destructive-foreground text-sm" role="alert">
            {problem || upload.error}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function NoFiles(props: NoFilesProps) {
  return (
    <ScreenBoundary name="NoFiles">
      <NoFilesScreen {...props} />
    </ScreenBoundary>
  );
}
