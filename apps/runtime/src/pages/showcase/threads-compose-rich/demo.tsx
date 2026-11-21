// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: picked files are listed by name without uploading; Reply waits and then clears.
// Not shipped by the registry; builders upload in onAttach and post in onSubmit.
import { Kbd } from "@wirefront/ui/kbd";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useState } from "react";
import * as fixtures from "./fixtures";
import { RichComposer } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ThreadsComposeRichShowcasePage() {
  const [attachments, setAttachments] = useState([fixtures.uploadAttachment]);
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <div className="min-h-svh bg-background text-foreground">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-16">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Composer</div>
          <h1 className="mt-1 font-heading text-2xl sm:text-3xl">Rich reply box</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Markdown shortcuts in the toolbar, mentions behind <Kbd>@</Kbd>, and attachments within reach.
          </p>
          <RichComposer
            attachments={attachments}
            className="mt-8 sm:mt-10"
            defaultValue={fixtures.draft}
            onAttach={(files) => setAttachments((a) => [...a, ...files.map((f) => ({ id: `${f.name}-${f.size}`, name: f.name }))])}
            onCancel={() => {}}
            onRemoveAttachment={(id) => setAttachments((a) => a.filter((x) => x.id !== id))}
            onSubmit={() => wait(500)}
            replyingTo={fixtures.replyingTo}
          />
        </div>
      </div>
    </WirefrontProvider>
  );
}
