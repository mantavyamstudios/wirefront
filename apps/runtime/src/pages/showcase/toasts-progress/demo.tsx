// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: two uploads that advance on a timer (deterministic steps), above a placeholder app.
// Not shipped by the registry; builders feed UploadDock from their own uploader.
import { useEffect, useState } from "react";
import { ToastBackdrop } from "../_toast-backdrop";
import * as fixtures from "./fixtures";
import { UploadDock } from "./view";

export function ToastsProgressShowcasePage() {
  const [uploads, setUploads] = useState(fixtures.uploads);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const id = window.setInterval(
      () =>
        setUploads((all) =>
          all.map((u, i) => ({
            ...u,
            progress: Math.min(1, u.progress + 0.02 + i * 0.01),
          }))
        ),
      600
    );
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <ToastBackdrop
        action="Upload again"
        onAction={() => {
          setUploads(fixtures.uploads);
          setOpen(true);
        }}
      />
      {open ? (
        <UploadDock
          onCancel={(id) => setUploads((all) => all.filter((u) => u.id !== id))}
          onClose={() => setOpen(false)}
          uploads={uploads}
        />
      ) : null}
    </div>
  );
}
