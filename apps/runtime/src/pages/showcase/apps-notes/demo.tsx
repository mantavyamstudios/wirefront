// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: sample notes in devl.dev's frame with a fixed clock; edits stay in the page and
// new notes are numbered locally. Not shipped by the registry; builders save onChange.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import { useRef } from "react";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { Notes } from "./view";

const demoNow = () => new Date(fixtures.now);

export function AppsNotesShowcasePage() {
  const count = useRef(0);
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <Notes
          folders={fixtures.listNoteFolders}
          initialNoteId="n1"
          notes={fixtures.listNotes}
          onChange={() => {}}
          onCreate={async ({ folderId }) => {
            const n = ++count.current;
            return ok({ ...fixtures.createNote, id: `n-new-${n}`, folderId, blocks: [{ id: `b-new-${n}`, type: "p", text: "" }] });
          }}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
