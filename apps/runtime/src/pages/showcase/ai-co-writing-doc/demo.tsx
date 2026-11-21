// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: plays live collaboration in devl.dev's frame. Mina's caret wanders, Quill types
// each suggestion a letter at a time, and every action saves after a short wait.
// Not shipped by the registry; builders feed CoWritingDoc from their realtime backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import type { DocFormat } from "./view";
import { CoWritingDoc } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function AiCoWritingDocShowcasePage() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [stop, setStop] = useState(0);
  const [formats, setFormats] = useState<DocFormat[]>([]);
  const full = fixtures.suggestions[index];

  // Type the current suggestion out, pausing a little longer after spaces.
  useEffect(() => {
    if (!full) return;
    if (reduce) {
      setTyped(full.text.length);
      return;
    }
    if (typed >= full.text.length) return;
    const delay = typed === 0 ? 1600 : full.text[typed - 1] === " " ? 70 : 38;
    const id = setTimeout(() => setTyped((n) => n + 1), delay);
    return () => clearTimeout(id);
  }, [full, typed, reduce]);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStop((m) => (m + 1) % fixtures.minaStops.length), 3400);
    return () => clearInterval(id);
  }, [reduce]);

  const next = async () => {
    await wait(200);
    setTyped(0);
    setIndex((i) => i + 1);
  };
  const mina = fixtures.minaStops[stop];

  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <CoWritingDoc
          activeFormats={formats}
          comments={fixtures.listDocComments}
          currentUser="theo"
          cursors={mina ? [mina, fixtures.scoutCursor] : [fixtures.scoutCursor]}
          doc={fixtures.getSharedDoc}
          onAcceptSuggestion={next}
          onAddComment={() => {}}
          onAskAgent={() => {}}
          onFormat={(f) => setFormats((on) => (on.includes(f) ? on.filter((x) => x !== f) : [...on, f]))}
          onRedo={() => {}}
          onRejectSuggestion={next}
          onReplyToComment={() => wait(300)}
          onResolveComment={() => wait(300)}
          onShare={() => {}}
          onUndo={() => {}}
          people={fixtures.listCollaborators}
          suggestion={full ? { ...full, text: full.text.slice(0, typed) } : undefined}
          suggestionStreaming={Boolean(full) && typed < (full?.text.length ?? 0)}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
