// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the dialog over a simulated uploader, open, with a queue in
// progress. Not shipped by the registry; builders wire UploadDialog to their
// own uploader.
import { useEffect, useState } from "react";
import * as fixtures from "./fixtures";
import type { UploadItem } from "./schema";
import { UploadDialog } from "./view";

export function ModalsUploadFilesShowcasePage() {
  const [uploads, setUploads] = useState<UploadItem[]>(fixtures.uploads);
  const [running, setRunning] = useState(false);

  // Advance in-flight uploads once someone interacts, so the preview stays still.
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setUploads((list) =>
        list.map((u) => (u.state !== "uploading" ? u : u.progress >= 96 ? { ...u, progress: 100, state: "done" } : { ...u, progress: u.progress + 4 })),
      );
    }, 400);
    return () => clearInterval(timer);
  }, [running]);

  const update = (id: string, patch: Partial<UploadItem>) => {
    setRunning(true);
    setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  return (
    <UploadDialog
      accept="image/png,image/jpeg,application/pdf,.fig,.zip"
      defaultOpen
      onAddFiles={(files) => {
        setRunning(true);
        setUploads((list) => [...list, ...files.map((f, i) => ({ id: `new-${list.length + i}`, name: f.name, size: f.size, progress: 0, state: "uploading" as const }))]);
      }}
      onCancel={(id) => setUploads((list) => list.filter((u) => u.id !== id))}
      onCancelAll={() => setUploads((list) => list.filter((u) => u.state === "done"))}
      onResume={(id) => update(id, { state: "uploading", error: undefined })}
      pageTitle="Assets · Brand"
      typesLabel="png, jpg, pdf, fig, zip"
      uploads={uploads}
    />
  );
}
