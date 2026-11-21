"use client";

import { createContext, useCallback, useContext } from "react";
import type { ReactNode } from "react";

import { isPageNew } from "@/lib/docs/is-recently-released";
import { useIsClient } from "@/lib/use-is-client";

const DocsReleaseDatesContext = createContext<Record<string, string>>({});

export const DocsReleaseDatesProvider = ({
  releaseDatesByUrl,
  children,
}: {
  releaseDatesByUrl: Record<string, string>;
  children: ReactNode;
}) => (
  <DocsReleaseDatesContext.Provider value={releaseDatesByUrl}>
    {children}
  </DocsReleaseDatesContext.Provider>
);

/** Evaluates after mount so SSR and hydration markup stay in sync. */
export const useDocsPageNew = (url?: string): boolean => {
  const releaseDatesByUrl = useContext(DocsReleaseDatesContext);
  const mounted = useIsClient();

  return mounted ? isPageNew(url, releaseDatesByUrl) : false;
};

export const useCheckDocsPageNew = (): ((url?: string) => boolean) => {
  const releaseDatesByUrl = useContext(DocsReleaseDatesContext);
  const mounted = useIsClient();

  return useCallback(
    (url?: string) => (mounted ? isPageNew(url, releaseDatesByUrl) : false),
    [mounted, releaseDatesByUrl]
  );
};
