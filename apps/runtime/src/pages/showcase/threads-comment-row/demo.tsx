// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: three rows in a list; reactions save after a short wait and Delete removes the
// row. Not shipped by the registry; builders render CommentRow for each comment they load.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useState } from "react";
import * as fixtures from "./fixtures";
import { CommentRow } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const noop = () => {};

export function ThreadsCommentRowShowcasePage() {
  const [comments, setComments] = useState(fixtures.listComments);
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <div className="min-h-svh bg-background text-foreground">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-16">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Comment patterns</div>
          <h1 className="mt-1 font-heading text-2xl sm:text-3xl">Single comment row</h1>
          <p className="mt-2 text-muted-foreground text-sm">The atomic unit — same shape used inline, in side panels, and in activity feeds.</p>
          <ul className="mt-8 flex flex-col gap-4 sm:mt-10 sm:gap-6">
            {comments.map((c) => (
              <li key={c.id}>
                <CommentRow comment={c} onCopyLink={noop} onDelete={(id) => setComments((cs) => cs.filter((x) => x.id !== id))} onEdit={noop} onOpenReplies={noop} onReact={() => wait(300)} onReply={noop} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </WirefrontProvider>
  );
}
