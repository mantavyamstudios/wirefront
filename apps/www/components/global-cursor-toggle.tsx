"use client";

import { Cursor, CursorProvider } from "@workspace/ui/components/cursor";
import { useEffect, useState } from "react";

const isCursorToggleShortcut = (event: KeyboardEvent) =>
  event.key.toLowerCase() === "c" &&
  event.shiftKey &&
  (event.metaKey || event.ctrlKey);

export const GlobalCursorToggle = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isCursorToggleShortcut(event)) {
        return;
      }

      event.preventDefault();
      setEnabled((current) => !current);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <CursorProvider global>
      <Cursor />
    </CursorProvider>
  );
};
