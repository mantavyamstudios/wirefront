// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: wires the view to fixture data inside devl.dev's frame.
// Connecting takes a moment, and the first attempt at an app in
// fixtures.authErrors fails so the retry path can be seen.
// Not shipped by the registry; builders wire ConnectorMarketplace to their own backend.
import { fail } from "@wirefront/ui/wirefront/types";
import {
  ActivityIcon,
  BugIcon,
  DatabaseIcon,
  FileTextIcon,
  GitBranchIcon,
  LifeBuoyIcon,
  MailIcon,
  MegaphoneIcon,
  MessagesSquareIcon,
  PaletteIcon,
  PenToolIcon,
  PiggyBankIcon,
  ReceiptIcon,
  RocketIcon,
  SparklesIcon,
  TableIcon,
  VideoIcon,
} from "lucide-react";
import { useRef } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { ConnectorMarketplace } from "./view";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const icons = {
  relay: <MessagesSquareIcon />,
  postbox: <MailIcon />,
  huddle: <VideoIcon />,
  forge: <GitBranchIcon />,
  tracer: <BugIcon />,
  launchpad: <RocketIcon />,
  tally: <ReceiptIcon />,
  coffer: <PiggyBankIcon />,
  inkwell: <PenToolIcon />,
  swatch: <PaletteIcon />,
  silo: <DatabaseIcon />,
  gridline: <TableIcon />,
  beacon: <ActivityIcon />,
  harbor: <LifeBuoyIcon />,
  murmur: <MegaphoneIcon />,
  lumen: <SparklesIcon />,
  scribe: <FileTextIcon />,
};

export function SettingsConnectorsShowcasePage() {
  const state = useShowcaseState();
  const failed = useRef(new Set<string>());
  return (
    <DevlFrame>
      <ConnectorMarketplace
        apps={
          state === "loading" || state === "error"
            ? undefined
            : state === "empty"
              ? []
              : fixtures.listConnectorApps
        }
        error="The app directory didn’t load. Check your connection and try again."
        icons={icons}
        onConnect={async (id) => {
          await wait(1400);
          const reason = fixtures.authErrors[id];
          if (reason && !failed.current.has(id)) {
            failed.current.add(id);
            return fail(reason);
          }
        }}
        onDisconnect={() => wait(300)}
        onRequestApp={() => wait(500)}
        onRetry={() => {}}
        onSettingChange={() => wait(300)}
        status={
          state === "loading"
            ? "loading"
            : state === "error"
              ? "error"
              : "ready"
        }
        workspace={fixtures.workspace}
      />
    </DevlFrame>
  );
}
