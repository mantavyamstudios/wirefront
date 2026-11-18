// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: a simulated call in devl.dev's frame. The speaker moves around, people drop in and
// out, reactions float up and a few chat lines arrive; your own controls update the call.
// Not shipped by the registry; builders drive VideoCall from their realtime media service.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useEffect, useRef, useState } from "react";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import type { CallMessage, CallPerson, CallReaction } from "./schema";
import { CALL_REACTIONS, VideoCall } from "./view";

const start = Date.parse(fixtures.now);
const DROPS: { op: "join" | "leave"; index: number }[] = [
  { op: "join", index: 0 },
  { op: "join", index: 1 },
  { op: "leave", index: 0 },
  { op: "join", index: 2 },
  { op: "leave", index: 1 },
  { op: "leave", index: 2 },
];

export function AppsVideoCallShowcasePage() {
  const mountedAt = useRef(0);
  const [participants, setParticipants] = useState<CallPerson[]>(fixtures.participants);
  const [speakerId, setSpeakerId] = useState<string | null>("tomas");
  const [messages, setMessages] = useState<CallMessage[]>(fixtures.messages);
  const [reactions, setReactions] = useState<CallReaction[]>([]);
  const [inCall, setInCall] = useState(true);
  const tick = useRef(0);
  const live = useRef(participants);
  live.current = participants;

  // The demo clock runs from the fixture time at real speed.
  const demoNow = () => new Date(start + (mountedAt.current ? performance.now() - mountedAt.current : 0));
  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  useEffect(() => {
    if (!inCall) return;
    const id = setInterval(() => {
      const n = ++tick.current;
      const people = live.current;
      if (n % 3 === 0) {
        const talkers = people.filter((p) => !p.muted);
        setSpeakerId(talkers.length ? (talkers[n % talkers.length]?.id ?? null) : null);
      }
      if (n % 8 === 4) {
        const step = DROPS[Math.floor(n / 8) % DROPS.length];
        const person = step ? fixtures.dropIns[step.index % fixtures.dropIns.length] : undefined;
        if (step && person) {
          const here = people.some((p) => p.id === person.id);
          if (step.op === "join" && !here) setParticipants((ps) => [...ps, person]);
          if (step.op === "leave" && here) setParticipants((ps) => ps.filter((p) => p.id !== person.id));
        }
      }
      if (n % 5 === 2) {
        const who = people[n % Math.max(people.length, 1)];
        const emoji = CALL_REACTIONS[n % 5];
        if (who && emoji) setReactions((rs) => [...rs.slice(-10), { id: `r${n}`, emoji, name: who.name.split(" ")[0] ?? who.name }]);
      }
      const line = n % 14 === 10 ? fixtures.script[Math.floor(n / 14)] : undefined;
      if (line && people.some((p) => p.id === line.authorId)) setMessages((m) => [...m, { id: `s${n}`, authorId: line.authorId, text: line.text, sentAt: new Date(start + n * 1000).toISOString() }]);
    }, 1000);
    return () => clearInterval(id);
  }, [inCall]);

  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <VideoCall
          devices={fixtures.devices}
          inviteUrl={`https://meet.example/${fixtures.meetingCode}`}
          meetingCode={fixtures.meetingCode}
          messages={messages}
          onLeave={() => setInCall(false)}
          onMuteAll={() => setParticipants((ps) => ps.map((p) => ({ ...p, muted: true })))}
          onMuteParticipant={(id) => setParticipants((ps) => ps.map((p) => (p.id === id ? { ...p, muted: true } : p)))}
          onRateCall={() => {}}
          onReact={() => {}}
          onRejoin={() => setInCall(true)}
          onRemoveParticipant={(id) => setParticipants((ps) => ps.filter((p) => p.id !== id))}
          onSelectDevice={() => {}}
          onSendMessage={async ({ text }) => setMessages((m) => [...m, { id: `you-${m.length}`, authorId: fixtures.you.id, text, sentAt: demoNow().toISOString() }])}
          onToggleCamera={() => {}}
          onToggleHand={() => {}}
          onToggleMic={() => {}}
          onToggleShare={() => {}}
          participants={participants}
          reactions={reactions}
          speakerId={speakerId}
          startedAt={fixtures.getCall.startedAt}
          title={fixtures.getCall.title}
          you={fixtures.you}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
