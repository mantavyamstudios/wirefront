// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: a simulated live delivery in devl.dev's frame. A timer stands in for the
// courier feed and rides the rest of the route in 40 seconds; the courier answers chat
// messages after a moment. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import { useEffect, useRef, useState } from "react";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import type { DeliveryMessage, DeliveryTracking } from "./schema";
import { DeliveryTracker } from "./view";

const start = Date.parse(fixtures.now);
const demoNow = () => new Date(fixtures.now);
const SECONDS = 40;
const arrivesAt = new Date(start + fixtures.routeMinutes * (1 - fixtures.startAt) * 60_000).toISOString();

function trackingAt(progress: number): DeliveryTracking {
  return {
    status: progress >= 1 ? "delivered" : "on_the_way",
    progress,
    etaMinutes: Math.max(1, Math.ceil(fixtures.routeMinutes * (1 - progress))),
    arrivesAt,
    location: fixtures.locations.find((l) => progress >= l.from)?.text,
  };
}

function replyTo(text: string) {
  const s = text.toLowerCase();
  if (s.includes("door")) return "No problem, I’ll leave it by the door and send a photo.";
  if (s.includes("bell") || s.includes("ring")) return "Will do, I’ll ring when I’m outside.";
  if (s.includes("down") || s.includes("coming")) return "Great, see you downstairs in a few minutes.";
  return "Got it, thanks!";
}

export function CommerceDeliveryTrackerShowcasePage() {
  const [tracking, setTracking] = useState(() => trackingAt(fixtures.startAt));
  const [messages, setMessages] = useState<DeliveryMessage[]>(fixtures.listCourierMessages);
  const [typing, setTyping] = useState(false);
  const count = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let elapsed = 0;
    const id = window.setInterval(() => {
      elapsed += 1;
      const progress = Math.min(1, fixtures.startAt + ((1 - fixtures.startAt) * elapsed) / SECONDS);
      setTracking(trackingAt(progress));
      if (progress >= 1) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(
    () => () => {
      for (const id of timers.current) window.clearTimeout(id);
    },
    [],
  );

  const stamp = () => new Date(start + ++count.current * 60_000).toISOString();

  return (
    <WirefrontProvider currency="USD" locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <DeliveryTracker
          courierTyping={typing}
          messages={messages}
          onRate={async () => {}}
          onSendMessage={async ({ text }) => {
            const sent: DeliveryMessage = { id: `me-${count.current + 1}`, from: "me", text, sentAt: stamp() };
            timers.current.push(
              window.setTimeout(() => setTyping(true), 500),
              window.setTimeout(() => {
                setTyping(false);
                setMessages((m) => [...m, sent, { id: `c-${count.current + 1}`, from: "courier", text: replyTo(text), sentAt: stamp() }]);
              }, 1700),
            );
            return ok(sent);
          }}
          onTip={async () => {}}
          onUpdateNote={async () => {}}
          order={fixtures.getDeliveryOrder}
          quickReplies={fixtures.quickReplies}
          tipOptions={fixtures.tipOptions}
          tracking={tracking}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
