// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: sample folders in devl.dev's frame with a fixed clock; stars save after a short
// wait and new folders are numbered locally. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import { useRef } from "react";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { Drive } from "./view";

const demoNow = () => new Date(fixtures.now);
const save = () => new Promise<void>((resolve) => setTimeout(resolve, 200));

export function AppsDriveShowcasePage() {
  const count = useRef(0);
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <Drive
          folders={fixtures.listFolders}
          members={fixtures.members}
          onCreateFolder={async () => {
            await save();
            const n = ++count.current;
            return ok({
              ...fixtures.createFolder,
              id: `new-${n}`,
              name: n === 1 ? "Untitled folder" : `Untitled folder ${n}`,
            });
          }}
          onCreateFromTemplate={() => {}}
          onBrowseTemplates={() => {}}
          onGetMoreSpace={() => {}}
          onOpenFolder={() => {}}
          onOpenTrash={() => {}}
          onSwitchWorkspace={() => {}}
          onToggleStar={save}
          onUpload={() => {}}
          storage={fixtures.getStorage}
          templates={fixtures.listTemplates}
          workspace={fixtures.workspace}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
