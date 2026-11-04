import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTheme } from "@orbit/ui/theme-provider";
import { CATEGORIES, getCategory, type CategorySlug } from "@/lib/designs";
import { getShowcase } from "@/pages/showcase/registry";
import { AnimatePresence } from "motion/react";
import { CodeStage } from "@/pages/showcase/_code-viewer";
import {
  type Device,
  DeviceStage,
  InteractionPanel,
  type ThemeSyncMessage,
} from "@/components/interaction-panel";
import { DesignNotFound } from "@/pages/design-not-found";

interface DesignSearch {
  preview?: string;
}

export const Route = createFileRoute("/c/$category/$design")({
  // TanStack JSON-parses search params, so `?preview=1` arrives as the
  // number 1 and `?preview=true` as a boolean. Normalise to a string.
  validateSearch: (raw: Record<string, unknown>): DesignSearch => ({
    preview:
      typeof raw.preview === "string" ||
      typeof raw.preview === "number" ||
      typeof raw.preview === "boolean"
        ? String(raw.preview)
        : undefined,
  }),
  head: ({ params }) => {
    const category = getCategory(params.category as CategorySlug);
    const design = category?.designs.find((d) => d.slug === params.design);
    if (!category || !design) return {};
    const url = `https://devl.dev/c/${params.category}/${params.design}`;
    const title = `${design.title} · ${category.title} — devl.dev`;
    const description = design.blurb;
    const image = `https://devl.dev/previews/${params.category}__${params.design}--dark.png`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: DesignRoute,
});

type DesignTarget = { category: string; design: string };

function pickRandomDesign(current: DesignTarget): DesignTarget | null {
  const all = CATEGORIES.flatMap((c) =>
    c.designs
      .filter((d) => !!getShowcase(c.slug, d.slug))
      .map((d) => ({ category: c.slug, design: d.slug })),
  );
  const others = all.filter(
    (d) => !(d.category === current.category && d.design === current.design),
  );
  if (others.length === 0) return null;
  return others[Math.floor(Math.random() * others.length)] ?? null;
}

function siblingDesign(
  current: DesignTarget,
  delta: 1 | -1,
): DesignTarget | null {
  const cat = CATEGORIES.find((c) => c.slug === current.category);
  if (!cat) return null;
  const designs = cat.designs.filter((d) => !!getShowcase(cat.slug, d.slug));
  if (designs.length === 0) return null;
  const idx = designs.findIndex((d) => d.slug === current.design);
  if (idx === -1) return null;
  const nextIdx = (idx + delta + designs.length) % designs.length;
  const next = designs[nextIdx];
  return next ? { category: cat.slug, design: next.slug } : null;
}

function siblingCategory(
  current: DesignTarget,
  delta: 1 | -1,
): DesignTarget | null {
  const populated = CATEGORIES.filter((c) =>
    c.designs.some((d) => !!getShowcase(c.slug, d.slug)),
  );
  if (populated.length <= 1) return null;
  const idx = populated.findIndex((c) => c.slug === current.category);
  if (idx === -1) return null;
  const nextIdx = (idx + delta + populated.length) % populated.length;
  const nextCat = populated[nextIdx];
  if (!nextCat) return null;
  const firstDesign = nextCat.designs.find(
    (d) => !!getShowcase(nextCat.slug, d.slug),
  );
  return firstDesign
    ? { category: nextCat.slug, design: firstDesign.slug }
    : null;
}

function isTypingTarget(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return true;
  return el.isContentEditable;
}

function DesignRoute() {
  const { category, design } = Route.useParams();
  const { preview } = Route.useSearch();
  const isPreview = preview === "1" || preview === "true";
  const navigate = useNavigate();
  const { toggleLightDark, setPreference, setPalette } = useTheme();
  const found = getCategory(category);
  const [codeOpen, setCodeOpen] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");
  const [replays, setReplays] = useState(0);
  const [landscape, setLandscape] = useState(false);
  // Keep the in-page design mounted until the device frame has loaded, so
  // switching away from desktop never flashes an empty page.
  const [stageReady, setStageReady] = useState(false);
  useEffect(() => {
    if (device === "desktop") setStageReady(false);
  }, [device]);
  const [panelHidden, setPanelHidden] = usePanelHidden();

  // Device-width previews run this route in an iframe with ?preview=1; follow
  // the parent's theme and palette as they change.
  useEffect(() => {
    if (!isPreview) return;
    const onMessage = (e: MessageEvent<ThemeSyncMessage>) => {
      if (e.origin !== window.location.origin || e.data?.type !== "wirefront:theme") return;
      setPreference(e.data.theme);
      setPalette(e.data.palette as Parameters<typeof setPalette>[0]);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isPreview, setPreference, setPalette]);

  const goTo = (next: DesignTarget | null) => {
    if (!next) return;
    void navigate({
      to: "/c/$category/$design",
      params: { category: next.category, design: next.design },
    });
  };
  // Esc / Back always lands on the index; ← → handle previous and next.
  const goBack = () => {
    void navigate({ to: "/" });
  };
  const browse = (delta: 1 | -1) => goTo(siblingDesign({ category, design }, delta));
  const group = (delta: 1 | -1) => goTo(siblingCategory({ category, design }, delta));
  const random = () => goTo(pickRandomDesign({ category, design }));

  // Latest handlers for the keydown listener without re-binding it every render.
  const actions = useRef({ goBack, browse, group, random });
  actions.current = { goBack, browse, group, random };

  useEffect(() => {
    if (isPreview || !found) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget()) return;
      const a = actions.current;

      if (e.key === "Escape") {
        e.preventDefault();
        if (codeOpen) {
          setCodeOpen(false);
          return;
        }
        a.goBack();
        return;
      }
      // Other hotkeys are suppressed while the code viewer is open.
      if (codeOpen) return;
      if ((e.key === "r" || e.key === "R") && !e.shiftKey) {
        e.preventDefault();
        a.random();
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        a.browse(e.key === "ArrowRight" ? 1 : -1);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        a.group(e.key === "ArrowDown" ? 1 : -1);
        return;
      }
      if ((e.key === "t" || e.key === "T") && !e.shiftKey) {
        e.preventDefault();
        toggleLightDark();
        return;
      }
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setCodeOpen(true);
        return;
      }
      if ((e.key === "o" || e.key === "O") && !e.shiftKey) {
        e.preventDefault();
        setLandscape((v) => !v);
        return;
      }
      if ((e.key === "h" || e.key === "H") && !e.shiftKey) {
        e.preventDefault();
        setPanelHidden((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [isPreview, found, toggleLightDark, codeOpen, setPanelHidden]);

  if (!found) return <DesignNotFound category={category} />;
  const meta = found.designs.find((d) => d.slug === design);
  const Showcase = getShowcase(found.slug as CategorySlug, design);
  if (!meta || !Showcase) {
    return <DesignNotFound category={category} design={design} />;
  }

  if (isPreview) {
    return (
      <div className="relative min-h-svh bg-background text-foreground">
        <Showcase />
      </div>
    );
  }

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      {(device === "desktop" || !stageReady) && <Showcase key={replays} />}
      <AnimatePresence>
        {device !== "desktop" && (
          <DeviceStage
            device={device}
            landscape={landscape}
            key="device-stage"
            onReady={() => setStageReady(true)}
            reloadKey={replays}
            src={`/c/${category}/${design}?preview=1`}
          />
        )}
      </AnimatePresence>
      <InteractionPanel
        codeOpen={codeOpen}
        device={device}
        hidden={panelHidden}
        onCodeOpenChange={setCodeOpen}
        onDeviceChange={setDevice}
        onReplay={() => setReplays((n) => n + 1)}
        landscape={landscape}
        onLandscapeChange={setLandscape}
        onBack={goBack}
        onBrowse={browse}
        onGroup={group}
        onRandom={random}
      />
      <AnimatePresence>
        {codeOpen && (
          <CodeStage
            category={found.slug as CategorySlug}
            design={design}
            key="code"
            title={meta.title}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const PANEL_HIDDEN_KEY = "wirefront-panel-hidden";

function usePanelHidden() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(PANEL_HIDDEN_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);
  const update = (next: boolean | ((prev: boolean) => boolean)) => {
    setHidden((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      try {
        localStorage.setItem(PANEL_HIDDEN_KEY, value ? "1" : "0");
      } catch {
        /* ignore */
      }
      return value;
    });
  };
  return [hidden, update] as const;
}
