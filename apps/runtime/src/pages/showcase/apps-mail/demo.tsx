// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: a sample mailbox in devl.dev's frame with a fixed clock. Changes save after a
// short wait; replies and new messages are built locally. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import { useRef } from "react";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import type { MailThread } from "./schema";
import { Mail } from "./view";

const demoNow = () => new Date(fixtures.now);
const save = () => new Promise<void>((resolve) => setTimeout(resolve, 200));
const attachmentsOf = (files: File[]) =>
  files.map((f) => ({
    name: f.name,
    size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
    kind: "doc" as const,
  }));

export function AppsMailShowcasePage() {
  const count = useRef(0);
  const threads = useRef<MailThread[]>(fixtures.listThreads);
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <Mail
          account={fixtures.account}
          labels={fixtures.listLabels}
          onOpenAttachment={() => {}}
          onReply={async ({ threadId, body, files }) => {
            await save();
            const thread = threads.current.find((th) => th.id === threadId);
            const to = thread?.messages.at(-1)?.from.name.split(" ")[0] ?? "";
            return ok({
              id: `reply-${++count.current}`,
              from: fixtures.account,
              to: `to ${to}`,
              sentAt: fixtures.now,
              body: body ? body.split(/\n{2,}/) : [],
              attachments: files.length ? attachmentsOf(files) : undefined,
            });
          }}
          onSend={async ({ to, subject, body, files }) => {
            await save();
            const n = ++count.current;
            return ok({
              id: `sent-${n}`,
              subject,
              folder: "sent",
              messages: [
                {
                  id: "m1",
                  from: fixtures.account,
                  to: `to ${to}`,
                  sentAt: fixtures.now,
                  body: body ? body.split(/\n{2,}/) : [],
                  attachments: files.length ? attachmentsOf(files) : undefined,
                },
              ],
            });
          }}
          onUpdateThread={save}
          quickReplies={fixtures.quickReplies}
          storage={fixtures.storage}
          threads={fixtures.listThreads}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
