import { type ReactNode, useEffect } from "react";

// Screens ported from devl.dev were designed for a sans-serif base, while the
// scratchpad sets `font-mono` on <html>. Switch the root font while one of
// them is mounted so portalled popovers, menus and dialogs match too.
export function DevlFrame({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("font-sans");
    return () => root.classList.remove("font-sans");
  }, []);

  return <div className="min-h-svh font-sans *:h-svh! *:min-h-[600px]">{children}</div>;
}
