// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type Direction, parseHostMessage, type RuntimeMessage } from "@wirefront/bridge";
import { useTheme } from "@wirefront/ui/theme-provider";
import { isOrbitThemePalette } from "@wirefront/ui/themes/types";
import { Fragment, useEffect, useRef, useState } from "react";
import { DesignError } from "@/components/design-error";
import { type CategorySlug, getCategory } from "@/lib/designs";
import { parseScreenState, ShowcaseStateProvider } from "@/lib/showcase-state";
import { DesignNotFound } from "@/pages/design-not-found";
import { getShowcase } from "@/pages/showcase/registry";

interface PreviewSearch {
  /** The screen state to show (screens that declare `states`). */
  state?: string;
  /** Lay the screen out right-to-left, as a builder's RTL app would. */
  dir?: "rtl";
}

/**
 * Origins allowed to drive this page. The site serves the runtime from its
 * own origin in production; in development the site runs on another port,
 * named by VITE_SHELL_ORIGIN (for example http://localhost:3000).
 */
const SHELL_ORIGINS = new Set(
  [typeof window === "undefined" ? "" : window.location.origin, import.meta.env.VITE_SHELL_ORIGIN ?? ""].filter(Boolean),
);

function postToShell(message: RuntimeMessage) {
  if (typeof window === "undefined" || window.parent === window) return;
  for (const origin of SHELL_ORIGINS) window.parent.postMessage(message, origin);
}

export const Route = createFileRoute("/preview/$category/$design")({
  validateSearch: (raw: Record<string, unknown>): PreviewSearch => ({
    state: typeof raw.state === "string" ? raw.state : undefined,
    dir: raw.dir === "rtl" ? "rtl" : undefined,
  }),
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }] }),
  component: PreviewRoute,
  errorComponent: PreviewError,
});

function PreviewError(props: Parameters<typeof DesignError>[0]) {
  const message = props.error instanceof Error ? props.error.message : String(props.error);
  useEffect(() => postToShell({ type: "wf:error", message }), [message]);
  return <DesignError {...props} />;
}

/**
 * One screen, full page, no site chrome: what the site's device frame shows
 * and what "Open in new tab" opens. Listens for the site's messages
 * (@wirefront/bridge) so the same document switches screens without reloading.
 */
function PreviewRoute() {
  const { category, design } = Route.useParams();
  const { state, dir } = Route.useSearch();
  const navigate = useNavigate();
  const { setPreference, setPalette } = useTheme();
  const [replays, setReplays] = useState(0);

  const found = getCategory(category);
  const states = found?.designs.find((d) => d.slug === design)?.states ?? [];
  const screenState = parseScreenState(state, states);
  const Showcase = found ? getShowcase(found.slug as CategorySlug, design) : undefined;

  const latest = useRef({ category, design, state, dir });
  latest.current = { category, design, state, dir };

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window.parent || !SHELL_ORIGINS.has(e.origin)) return;
      const message = parseHostMessage(e.data);
      if (!message) return;
      const current = latest.current;
      switch (message.type) {
        case "wf:navigate":
          if (message.category === current.category && message.design === current.design) {
            postToShell({ type: "wf:ready", category: current.category, design: current.design });
            return;
          }
          // A new screen starts in its default state, left to right unless the site says otherwise.
          void navigate({
            to: "/preview/$category/$design",
            params: { category: message.category, design: message.design },
            search: { dir: current.dir },
            replace: true,
          });
          return;
        case "wf:reset":
          setReplays((n) => n + 1);
          return;
        case "wf:theme":
          setPreference(message.mode);
          if (isOrbitThemePalette(message.palette)) setPalette(message.palette);
          return;
        case "wf:state":
          void navigate({
            to: "/preview/$category/$design",
            params: { category: current.category, design: current.design },
            search: { dir: current.dir, state: message.state === "ready" ? undefined : message.state },
            replace: true,
          });
          return;
        case "wf:dir":
          void navigate({
            to: "/preview/$category/$design",
            params: { category: current.category, design: current.design },
            search: { state: current.state, dir: message.dir === "rtl" ? "rtl" : undefined },
            replace: true,
          });
          return;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [navigate, setPreference, setPalette]);

  const missing = !Showcase;
  useEffect(() => {
    if (missing) postToShell({ type: "wf:error", message: `No screen ${category}/${design}` });
  }, [missing, category, design]);

  if (!found) return <DesignNotFound category={category} />;
  if (!Showcase) return <DesignNotFound category={category} design={design} />;

  const direction: Direction = dir ?? "ltr";
  return (
    <ShowcaseStateProvider value={screenState}>
      <DirectionProvider direction={direction}>
        <div className="relative min-h-svh bg-background text-foreground" dir={dir}>
          <Fragment key={`${category}/${design}/${replays}`}>
            <Showcase />
            <ReadyMarker category={category} design={design} />
          </Fragment>
        </div>
      </DirectionProvider>
    </ShowcaseStateProvider>
  );
}

/**
 * Rendered after the screen inside the same keyed fragment, so its effect runs
 * once the screen's own mount effects have run, again after every replay.
 * Tools (the responsive audit, browser checks) wait for data-design-ready;
 * the site waits for wf:ready.
 */
function ReadyMarker({ category, design }: { category: string; design: string }) {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-design-ready", `${category}/${design}`);
    postToShell({ type: "wf:ready", category, design });
    return () => root.removeAttribute("data-design-ready");
  }, [category, design]);
  return null;
}
