// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: a sample workspace in devl.dev's frame with a fixed clock. The page keeps the
// channels itself, like a builder's store, and a teammate types back after you post in some
// channels. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import { useEffect, useRef, useState } from "react";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import type { ChatChannel, ChatMessage, ChatReaction, ChatReply } from "./schema";
import { type ChatTarget, TeamChat } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function edit(channels: ChatChannel[], target: ChatTarget, fn: (m: ChatReply) => ChatReply): ChatChannel[] {
  return channels.map((c) =>
    c.id !== target.channelId
      ? c
      : {
          ...c,
          messages: c.messages.map((m) => {
            if (m.id !== target.messageId) return m;
            if (!target.replyId) return { ...m, ...fn(m) };
            return { ...m, replies: m.replies?.map((r) => (r.id === target.replyId ? fn(r) : r)) };
          }),
        },
  );
}

function toggle(reactions: ChatReaction[] | undefined, emoji: string): ChatReaction[] {
  const list = reactions ?? [];
  const hit = list.find((r) => r.emoji === emoji);
  if (!hit) return [...list, { emoji, people: [fixtures.me] }];
  const who = hit.people.includes(fixtures.me) ? hit.people.filter((p) => p !== fixtures.me) : [...hit.people, fixtures.me];
  return who.length ? list.map((r) => (r.emoji === emoji ? { ...r, people: who } : r)) : list.filter((r) => r.emoji !== emoji);
}

export function AppsTeamChatShowcasePage() {
  const [channels, setChannels] = useState(fixtures.listChannels);
  const [typing, setTyping] = useState<{ channelId: string; personId: string } | null>(null);
  const count = useRef(0);
  const clock = useRef(Date.parse(fixtures.now));
  const timers = useRef<number[]>([]);
  useEffect(() => () => {
    for (const id of timers.current) window.clearTimeout(id);
  }, []);

  const stamp = () => {
    clock.current += 60_000;
    return new Date(clock.current).toISOString();
  };
  const append = (channelId: string, message: ChatMessage) => setChannels((cs) => cs.map((c) => (c.id === channelId ? { ...c, messages: [...c.messages, message] } : c)));

  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <TeamChat
          channels={channels}
          me={fixtures.me}
          onCreateChannel={async ({ name }) => {
            await wait(150);
            const c: ChatChannel = { id: name, name, kind: "channel", members: 1, messages: [] };
            setChannels((cs) => {
              const firstDm = cs.findIndex((x) => x.kind === "dm");
              return firstDm < 0 ? [...cs, c] : [...cs.slice(0, firstDm), c, ...cs.slice(firstDm)];
            });
            return ok(c);
          }}
          onMarkRead={(id) => setChannels((cs) => cs.map((c) => (c.id === id ? { ...c, unread: 0, mentions: 0 } : c)))}
          onOpenDirectMessage={async ({ personId }) => {
            await wait(150);
            const person = fixtures.people.find((p) => p.id === personId);
            const c: ChatChannel = { id: `dm-${personId}`, name: person?.name ?? personId, kind: "dm", with: personId, messages: [] };
            setChannels((cs) => (cs.some((x) => x.id === c.id) ? cs : [...cs, c]));
            return ok(c);
          }}
          onReply={async ({ channelId, messageId, text }) => {
            await wait(150);
            const r: ChatReply = { id: `r${++count.current}`, author: fixtures.me, sentAt: stamp(), text };
            setChannels((cs) => cs.map((c) => (c.id === channelId ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, replies: [...(m.replies ?? []), r] } : m)) } : c)));
            return ok(r);
          }}
          onSendMessage={async ({ channelId, text, file }) => {
            await wait(150);
            const message: ChatMessage = { id: `m${++count.current}`, author: fixtures.me, sentAt: stamp(), text, file: file ? { name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB` } : undefined };
            append(channelId, message);
            const dm = channels.find((c) => c.id === channelId)?.with;
            const auto = fixtures.autoReplies[channelId] ?? (dm ? { author: dm, text: "Sounds good, talk soon." } : null);
            if (auto && !typing) {
              timers.current.push(
                window.setTimeout(() => setTyping({ channelId, personId: auto.author }), 900),
                window.setTimeout(() => {
                  setTyping(null);
                  append(channelId, { id: `m${++count.current}`, author: auto.author, sentAt: stamp(), text: auto.text });
                }, 2600),
              );
            }
            return ok(message);
          }}
          onToggleReaction={async ({ emoji, ...target }) => setChannels((cs) => edit(cs, target, (m) => ({ ...m, reactions: toggle(m.reactions, emoji) })))}
          onToggleSaved={async ({ saved, ...target }) => setChannels((cs) => edit(cs, target, (m) => ({ ...m, saved })))}
          people={fixtures.people}
          typing={typing}
          workspace={fixtures.workspace}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
