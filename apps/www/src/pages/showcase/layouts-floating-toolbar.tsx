import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BoldIcon,
  HighlighterIcon,
  ItalicIcon,
  LinkIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  Share2Icon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react";
import { Button } from "@orbit/ui/button";
import { Separator } from "@orbit/ui/separator";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@orbit/ui/tooltip";

type Anchor = { top: number; bottom: number; centerX: number };
type ToolbarPos = { top: number; left: number; placement: "above" | "below" };

const GAP = 8;
const EDGE = 8;

// SSR-safe layout effect.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function LayoutsFloatingToolbarShowcasePage() {
  const docRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<Range | null>(null);
  const pointerDownRef = useRef(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [pos, setPos] = useState<ToolbarPos | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  // Anchor in viewport coordinates (the toolbar is position: fixed).
  const measureAnchor = useCallback(() => {
    if (manualOpen) {
      const rect = docRef.current?.getBoundingClientRect();
      if (rect) setAnchor({ top: rect.top + 120, bottom: rect.top + 120, centerX: rect.left + rect.width / 2 });
      return;
    }
    const range = rangeRef.current;
    if (!range) return;
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    setAnchor({ top: rect.top, bottom: rect.bottom, centerX: rect.left + rect.width / 2 });
  }, [manualOpen]);

  useEffect(() => {
    const clear = () => {
      rangeRef.current = null;
      setAnchor(null);
    };

    const readSelection = () => {
      if (manualOpen) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return clear();
      const range = sel.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const node =
        container.nodeType === Node.TEXT_NODE
          ? container.parentElement
          : (container as Element);
      if (!node || !docRef.current?.contains(node)) return clear();
      rangeRef.current = range;
      measureAnchor();
    };

    // Mouse: show after the drag ends. Touch: selection handles only fire
    // `selectionchange`, so read it whenever no pointer is held down.
    const onPointerDown = (e: PointerEvent) => {
      pointerDownRef.current = true;
      const target = e.target as Node;
      if (!docRef.current?.contains(target) && !toolbarRef.current?.contains(target) && !manualOpen) {
        clear();
      }
    };
    const onPointerUp = () => {
      pointerDownRef.current = false;
      window.setTimeout(readSelection, 0);
    };
    const onSelectionChange = () => {
      if (!pointerDownRef.current) readSelection();
    };
    const onViewportChange = () => measureAnchor();

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("selectionchange", onSelectionChange);
    window.addEventListener("scroll", onViewportChange, { passive: true });
    window.addEventListener("resize", onViewportChange);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("selectionchange", onSelectionChange);
      window.removeEventListener("scroll", onViewportChange);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [manualOpen, measureAnchor]);

  // Place the toolbar once its size is known: clamp to the viewport edges and
  // flip below the selection when there's no room above. On touch screens it
  // always goes below, because the OS selection menu sits above.
  useIsoLayoutEffect(() => {
    const el = toolbarRef.current;
    if (!anchor || !el) {
      setPos(null);
      return;
    }
    const { width, height } = el.getBoundingClientRect();
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const fitsAbove = anchor.top - height - GAP >= EDGE;
    const placement = !coarse && fitsAbove ? "above" : "below";
    const top = placement === "above" ? anchor.top - height - GAP : anchor.bottom + GAP;
    const maxLeft = window.innerWidth - width - EDGE;
    const left = Math.max(EDGE, Math.min(maxLeft, anchor.centerX - width / 2));
    setPos({ top, left, placement });
  }, [anchor]);

  const toggleManual = () => {
    if (manualOpen) {
      setManualOpen(false);
      setAnchor(null);
      return;
    }
    setManualOpen(true);
    const rect = docRef.current?.getBoundingClientRect();
    if (rect) setAnchor({ top: rect.top + 120, bottom: rect.top + 120, centerX: rect.left + rect.width / 2 });
  };

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
        <div className="font-mono text-muted-foreground text-xs">
          Untitled · sean's pad
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Share2Icon />
            Share
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="More">
            <MoreHorizontalIcon />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs">
            Highlight any text to see the toolbar.
          </p>
          <Button variant="outline" size="sm" onClick={toggleManual}>
            {manualOpen ? "Hide toolbar" : "Show toolbar"}
          </Button>
        </div>

        <article ref={docRef} className="flex flex-col gap-5">
          <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
            Floating toolbars
          </h1>

          <p className="text-foreground/90 leading-relaxed">
            Contextual editing surfaces have quietly become the default way
            people format text on the modern web. Instead of crowding the
            chrome with every possible action, the editor waits — and only
            when you make a selection does the relevant set of tools surface,
            anchored to the words you actually care about.
          </p>

          <p className="text-foreground/90 leading-relaxed">
            The pattern goes by many names: bubble menu, hover toolbar,
            floating toolbar, selection menu. The mechanics are the same.
            Listen for selection changes, measure the bounding rectangle of
            the active range, and render a small pill of buttons just above
            it. When the user clicks elsewhere or the selection collapses,
            the toolbar dismisses itself.
          </p>

          <p className="text-foreground/90 leading-relaxed">
            Notion popularized the approach for documents, but it shows up
            anywhere users compose rich text — comment fields, knowledge
            bases, the address bar of a code editor. Each implementation is
            a small variation on the same trick: keep the canvas calm and
            let the toolbar appear only when it has something to do.
          </p>

          <h2 className="mt-4 font-heading text-2xl tracking-tight">
            What makes one feel right
          </h2>

          <p className="text-foreground/90 leading-relaxed">
            A good floating toolbar is fast, predictable, and never blocks
            the text you're working with. It appears above the selection by
            default, flips below when there isn't enough room, and stays put
            while you reach for it. Crucially, clicking a button must not
            collapse the underlying selection — otherwise every action
            becomes a two-step dance.
          </p>

          <h3 className="mt-2 font-heading text-lg tracking-tight">
            Mechanics worth getting right
          </h3>

          <ol className="ml-5 flex list-decimal flex-col gap-2 text-foreground/90 leading-relaxed">
            <li>
              Anchor the toolbar to the live selection rectangle, not the
              caret. The rectangle moves naturally as the selection grows.
            </li>
            <li>
              Use{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                onMouseDown
              </code>{" "}
              with{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                preventDefault
              </code>{" "}
              on the toolbar so clicks don't move focus or kill the range.
            </li>
            <li>
              Fade the toolbar in over ~150ms. Anything longer feels heavy;
              anything snappier looks broken.
            </li>
          </ol>

          <blockquote className="border-border border-l-4 pl-4 text-foreground/90 italic leading-relaxed">
            The best UI is the UI you don't notice. Floating toolbars work
            because they vanish the moment you stop needing them — leaving
            the page exactly as you found it.
          </blockquote>

          <p className="text-foreground/90 leading-relaxed">
            There's a deeper lesson here about progressive disclosure.
            Affordances don't have to live on the page forever. They can
            arrive when the user's intent becomes clear, do their job, and
            slip away. Done well, the canvas feels lighter and the controls
            feel more capable, both at the same time.
          </p>

          <p className="text-foreground/90 leading-relaxed">
            Try selecting a sentence anywhere in this document. The toolbar
            above will track your range and offer the formatting actions
            you'd expect — bold, italic, link, highlight, and a slot for
            leaving a comment. None of it ships data anywhere; it's a
            sketch, not a product.
          </p>
        </article>
      </main>

      {anchor ? (
        <div
          ref={toolbarRef}
          role="toolbar"
          aria-label="Formatting"
          // Keep the text selection when pressing toolbar buttons.
          onPointerDown={(e) => e.preventDefault()}
          style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0 }}
          data-placement={pos?.placement}
          className={`fixed z-50 inline-flex max-w-[calc(100vw-16px)] flex-wrap items-center justify-center gap-1 rounded-2xl border sm:rounded-full border-border bg-card px-1 py-1 shadow-lg transition-opacity duration-150 ${pos ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <ToolbarButton label="Bold">
            <BoldIcon />
          </ToolbarButton>
          <ToolbarButton label="Italic">
            <ItalicIcon />
          </ToolbarButton>
          <ToolbarButton label="Underline">
            <UnderlineIcon />
          </ToolbarButton>
          <ToolbarButton label="Strikethrough">
            <StrikethroughIcon />
          </ToolbarButton>
          <Separator orientation="vertical" className="h-4" />
          <ToolbarButton label="Link">
            <LinkIcon />
          </ToolbarButton>
          <ToolbarButton label="Highlight">
            <span className="relative inline-flex">
              <HighlighterIcon className="size-4" />
              <span className="-bottom-0.5 absolute right-0 size-1.5 rounded-full bg-yellow-400" />
            </span>
          </ToolbarButton>
          <Separator orientation="vertical" className="h-4" />
          <ToolbarButton label="Add comment">
            <MessageCircleIcon />
          </ToolbarButton>
          <ToolbarButton label="More">
            <MoreHorizontalIcon />
          </ToolbarButton>
        </div>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full pointer-coarse:size-10 text-foreground/80 transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [&_svg]:size-4"
          >
            {children}
          </button>
        }
      />
      <TooltipPopup>{label}</TooltipPopup>
    </Tooltip>
  );
}
