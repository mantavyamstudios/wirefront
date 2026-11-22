// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the composer starts mid-mention so the suggestions are open on load.
// Not shipped by the registry; builders pass the people and groups they load.
import * as fixtures from "./fixtures";
import { MentionComposer } from "./view";

export function ThreadsMentionPopoverShowcasePage() {
  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-24">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Composer
        </div>
        <h1 className="mt-1 font-heading text-2xl sm:text-3xl">
          Mention popover
        </h1>
        <MentionComposer
          className="mt-8 sm:mt-10"
          defaultValue={fixtures.draft}
          groups={fixtures.listMentionables.groups}
          members={fixtures.listMentionables.members}
        />
      </div>
    </div>
  );
}
