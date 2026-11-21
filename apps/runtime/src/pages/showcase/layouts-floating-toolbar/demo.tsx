// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the toolbar over a sample article inside a document page.
// Not shipped by the registry; builders wrap their own editor content.
import { Button } from "@wirefront/ui/button";
import { BoldIcon, HighlighterIcon, ItalicIcon, LinkIcon, MessageCircleIcon, MoreHorizontalIcon, Share2Icon, StrikethroughIcon, UnderlineIcon } from "lucide-react";
import { useState } from "react";
import { type SelectionAction, SelectionToolbar } from "./view";

const actions: SelectionAction[] = [
  { id: "bold", label: "Bold", icon: <BoldIcon /> },
  { id: "italic", label: "Italic", icon: <ItalicIcon /> },
  { id: "underline", label: "Underline", icon: <UnderlineIcon /> },
  { id: "strike", label: "Strikethrough", icon: <StrikethroughIcon /> },
  { id: "link", label: "Link", icon: <LinkIcon />, group: true },
  { id: "highlight", label: "Highlight", icon: <HighlighterIcon /> },
  { id: "comment", label: "Add comment", icon: <MessageCircleIcon />, group: true },
];

export function LayoutsFloatingToolbarShowcasePage() {
  const [pinned, setPinned] = useState(false);
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 border-border/60 border-b px-4 py-3 sm:px-6">
        <div className="font-mono text-muted-foreground text-xs">Untitled · scratch pad</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost">
            <Share2Icon />
            Share
          </Button>
          <Button aria-label="More" size="icon-sm" variant="ghost">
            <MoreHorizontalIcon />
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs">Highlight any text to see the toolbar.</p>
          <Button onClick={() => setPinned((p) => !p)} size="sm" variant="outline">
            {pinned ? "Hide toolbar" : "Show toolbar"}
          </Button>
        </div>
        <SelectionToolbar actions={actions} forceOpen={pinned} onAction={() => {}}>
          <article className="flex flex-col gap-5">
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

          <ol className="ms-5 flex list-decimal flex-col gap-2 text-foreground/90 leading-relaxed">
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

          <blockquote className="border-border border-s-4 ps-4 text-foreground/90 italic leading-relaxed">
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
        </SelectionToolbar>
      </main>
    </div>
  );
}
