// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: a sample folder in devl.dev's frame. Upload adds the next sample file, new docs
// and deletes save after a short wait. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import {
  ClockIcon,
  HouseIcon,
  StarIcon,
  Trash2Icon,
  UsersRoundIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import type { FolderFile } from "./schema";
import { FolderView } from "./view";

const demoNow = () => new Date(fixtures.now);
const save = () => new Promise<void>((resolve) => setTimeout(resolve, 200));
const places = [
  { label: "All files", href: "#all", icon: <HouseIcon /> },
  { label: "Recent", href: "#recent", icon: <ClockIcon /> },
  { label: "Shared", href: "#shared", icon: <UsersRoundIcon /> },
  { label: "Starred", href: "#starred", icon: <StarIcon /> },
  { label: "Trash", href: "#trash", icon: <Trash2Icon /> },
];

export function AppsFolderViewShowcasePage() {
  const [files, setFiles] = useState<FolderFile[]>(fixtures.getFolder.files);
  const [folders, setFolders] = useState(fixtures.getFolder.folders);
  const added = useRef(0);
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <FolderView
          files={files}
          folders={folders}
          me={fixtures.me}
          members={fixtures.members}
          name={fixtures.getFolder.name}
          onDelete={save}
          onDownload={() => {}}
          onMove={() => {}}
          onNewDoc={async () => {
            await save();
            return ok({ ...fixtures.createDoc, id: `doc-${++added.current}` });
          }}
          onShare={() => {}}
          onShareFolder={() => {}}
          onUpload={(folderId) => {
            const n = added.current++;
            const sample = fixtures.uploads[n % fixtures.uploads.length];
            if (!sample) return;
            const file: FolderFile = {
              ...sample,
              id: `up-${n}`,
              editedBy: fixtures.me,
              editedAt: fixtures.now,
            };
            if (folderId === "root") setFiles((f) => [file, ...f]);
            else
              setFolders((fs) =>
                fs.map((f) =>
                  f.id === folderId ? { ...f, files: [file, ...f.files] } : f
                )
              );
          }}
          path={fixtures.path}
          places={places}
          storage={fixtures.storage}
          workspace={fixtures.workspace}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
