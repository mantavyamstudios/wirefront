// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the reader with a sample essay. Not shipped by the registry;
// builders render their own article as children.
import { ActivityIcon, HomeIcon, InboxIcon, SettingsIcon } from "lucide-react";
import * as fixtures from "./fixtures";
import { FocusReader } from "./view";

const nav = [
  { id: "home", label: "Home", href: "#home", icon: <HomeIcon /> },
  { id: "inbox", label: "Inbox", href: "#inbox", icon: <InboxIcon /> },
  { id: "activity", label: "Activity", href: "#activity", icon: <ActivityIcon /> },
  { id: "settings", label: "Settings", href: "#settings", icon: <SettingsIcon /> },
];

export function LayoutsFocusModeShowcasePage() {
  return (
    <FocusReader activeDocumentId="scratchpads" brand="Scratchpad" documents={fixtures.listDocuments} nav={nav} onSearch={() => {}} toc={fixtures.toc} user={fixtures.user}>
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Essay · 6 min read
        </div>
        <h1 className="mt-3 font-heading text-3xl tracking-tight sm:text-4xl">
          On building scratchpads.
        </h1>
        <p
          className="mt-3 text-muted-foreground"
        >
          A short meditation on iteration, the slow accumulation of taste, and
          why the best UI work happens far away from production.
        </p>

        <div
          className="mt-10 space-y-5 leading-relaxed"
        >
          <p id="intro">
            Most of what you ship started as a sketch on a napkin, in a Figma
            file you never opened again, or in a tiny app like this one. The
            scratchpad is the place where ideas are allowed to be wrong. It is
            cheap, throwaway, and quiet — and that is precisely what makes it
            useful.
          </p>
          <p>
            When you build inside a real product, every change is filtered
            through six other concerns: routing, auth, analytics, the design
            system, the eight people who will review the PR. Each of those is
            worthwhile in isolation, but together they raise the activation
            energy of trying anything new to a level where you stop trying.
          </p>

          <h2
            id="loop"
            className="!mt-12 !text-2xl pt-4 font-heading tracking-tight"
          >
            The iteration loop
          </h2>
          <p>
            Good interfaces come from tightening the loop between an idea and
            the next thing you learn from it. A scratchpad collapses that loop
            to seconds. You think of a layout, you type it, you see whether it
            holds up, and you decide what to keep. Repeat fifty times.
          </p>
          <p>
            The repetitions are the point. The fiftieth attempt at a sidebar
            does not look like the first because by then your hand knows things
            your head does not yet. Taste is built out of those small motor
            memories — the spacing that felt right, the weight that did not,
            the affordance you reached for without thinking.
          </p>

          <h2
            id="scaffolds"
            className="!mt-12 !text-2xl pt-4 font-heading tracking-tight"
          >
            Scaffolds vs. polish
          </h2>
          <p>
            There is a temptation, when you have a fast environment, to polish
            every sketch into a finished thing. Resist it. The scratchpad is
            for scaffolds — the cheap framing of an idea that lets you decide
            whether it is worth building properly somewhere else.
          </p>
          <p>
            Polish at this stage is a tax on exploration. Every minute spent
            picking the perfect shade of muted-foreground is a minute you are
            not generating the next idea. Sketch with the side of the pencil,
            not the tip.
          </p>

          <blockquote
            id="quote"
            className="!my-10 border-border border-s-4 ps-6 text-foreground/85 italic"
          >
            The fastest way to taste is volume. Build a hundred bad layouts and
            the next ten will be quietly excellent — not because you tried
            harder, but because your hand learned what the brief did not say.
          </blockquote>

          <p>
            A few habits make scratchpad work compounding rather than
            disposable. Keep them small. Name them well enough that you can
            find them next month. Resist building infrastructure inside the
            scratchpad — the moment it starts feeling like a real app, fork
            the idea out to where real apps live.
          </p>

          <ul className="!my-6 list-disc space-y-2 ps-6 text-foreground/90">
            <li>One idea per file. If two ideas want to merge, fork instead.</li>
            <li>No data layer. Hard-code everything. Real data is later.</li>
            <li>Steal shamelessly from your own past sketches.</li>
            <li>Throw away more than you keep, and do not feel bad about it.</li>
          </ul>

          <h2
            id="closing"
            className="!mt-12 !text-2xl pt-4 font-heading tracking-tight"
          >
            Closing thoughts
          </h2>
          <p>
            The work that ends up in production is the visible tip of a much
            larger pile of attempts. The pile is not waste — it is the
            substrate from which the visible work grew. Treat the scratchpad
            with the seriousness of a sketchbook, not the seriousness of a
            shippable product, and the rest follows.
          </p>
          <p>
            Now close the rails, dim the chrome, and write the next bad layout.
          </p>
        </div>
    </FocusReader>
  );
}
