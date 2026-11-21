// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the assistant in devl.dev's frame with a canned reply that streams in word by
// word, apps that connect after a short wait and a fake attachment.
// Not shipped by the registry; builders stream replies from their own model backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import {
  BotIcon,
  CalendarDaysIcon,
  CodeXmlIcon,
  FileSpreadsheetIcon,
  GlobeIcon,
  HardDriveIcon,
  HouseIcon,
  LibraryIcon,
  MailIcon,
  NotebookPenIcon,
  PanelsTopLeftIcon,
  ReceiptTextIcon,
  SquareKanbanIcon,
  TelescopeIcon,
} from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import type { AssistantChat, AssistantMessage, AssistantRequest } from "./schema";
import { AssistantStart } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const icons = {
  mail: <MailIcon />,
  cal: <CalendarDaysIcon />,
  drive: <HardDriveIcon />,
  tracker: <SquareKanbanIcon />,
  ledger: <ReceiptTextIcon />,
  s1: <NotebookPenIcon />,
  s2: <TelescopeIcon />,
  s3: <FileSpreadsheetIcon />,
  s4: <PanelsTopLeftIcon />,
  web: <GlobeIcon />,
  research: <TelescopeIcon />,
  code: <CodeXmlIcon />,
  canvas: <PanelsTopLeftIcon />,
};
const navigation = [
  { label: "Home", href: "#home", icon: <HouseIcon />, current: true },
  { label: "Agents", href: "#agents", icon: <BotIcon /> },
  { label: "Library", href: "#library", icon: <LibraryIcon /> },
];

/** The canned reply's steps and text for what was asked with. */
function buildReply(request: Pick<AssistantRequest, "apps" | "files" | "tools">) {
  const apps = fixtures.listApps.filter((a) => request.apps.includes(a.id));
  const steps = apps.map((a) => `Read ${a.name} · ${a.detail.toLowerCase()}`);
  if (request.tools.includes("web")) steps.push("Searched the web · 6 sources");
  if (request.tools.includes("research")) steps.push("Ran deep research · 4 passes");
  for (const f of request.files) steps.push(`Opened ${f}`);
  if (steps.length === 0) steps.push("Thought for 3 seconds");
  const sources = [...apps.map((a) => a.name), ...request.files];
  const from = sources.length === 0 ? "" : ` from ${new Intl.ListFormat("en-US").format(sources)}`;
  return { steps, text: fixtures.reply.replace("{from}", from) };
}

export function AiAssistantStartShowcasePage() {
  const reduce = useReducedMotion();
  const seq = useRef(0);
  const [chats, setChats] = useState<AssistantChat[]>(fixtures.listChats);
  const [apps, setApps] = useState(fixtures.listApps);
  const [files, setFiles] = useState<string[]>([]);
  const [messages, setMessages] = useState<(AssistantMessage & { full?: string })[]>([]);
  const [activeChat, setActiveChat] = useState<string>();
  const [stream, setStream] = useState<{ id: string; words: number } | null>(null);

  // Reveal the streaming reply two words at a time after a short "thinking" pause.
  useEffect(() => {
    if (!stream) return;
    const full = messages.find((m) => m.id === stream.id)?.full ?? "";
    const total = full.split(" ").length;
    if (stream.words >= total) {
      setMessages((ms) => ms.map((m) => (m.id === stream.id ? { ...m, text: full, streaming: false } : m)));
      setStream(null);
      return;
    }
    const id = setTimeout(
      () => {
        const words = stream.words + (reduce ? total : 2);
        setMessages((ms) => ms.map((m) => (m.id === stream.id ? { ...m, text: full.split(" ").slice(0, words).join(" ") } : m)));
        setStream({ id: stream.id, words });
      },
      stream.words === 0 ? 900 : 45,
    );
    return () => clearTimeout(id);
  }, [stream, messages, reduce]);

  const ask = (text: string, request: Pick<AssistantRequest, "apps" | "files" | "tools">, chatId?: string) => {
    const n = ++seq.current;
    const reply = buildReply(request);
    const pair: (AssistantMessage & { full?: string })[] = [
      { id: `u-${n}`, role: "user", text },
      { id: `a-${n}`, role: "assistant", text: "", full: reply.text, steps: reply.steps, streaming: true },
    ];
    setMessages((m) => (chatId ? pair : [...m, ...pair]));
    setStream({ id: `a-${n}`, words: 0 });
    if (chatId) setActiveChat(chatId);
    else if (messages.length === 0) {
      const id = `new-${n}`;
      setChats((c) => [{ id, title: text.length > 48 ? `${text.slice(0, 46).trimEnd()}…` : text, updatedAt: fixtures.now }, ...c]);
      setActiveChat(id);
    }
  };

  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <AssistantStart
          activeChat={activeChat}
          apps={apps}
          chats={chats}
          files={files}
          greeting="Good afternoon"
          icons={icons}
          messages={messages}
          models={fixtures.models}
          navigation={navigation}
          onAttach={() => setFiles((f) => (f.includes("q3-renewals.csv") ? [...f, `notes-${f.length}.pdf`] : [...f, "q3-renewals.csv"]))}
          onBrowseApps={() => {}}
          onConnectApp={async ({ id }) => {
            await wait(1400);
            setApps((all) => all.map((a) => (a.id === id ? { ...a, connected: true, detail: "Last 90 days" } : a)));
          }}
          onNewChat={() => {
            setMessages([]);
            setStream(null);
            setActiveChat(undefined);
          }}
          onNewProject={() => {}}
          onOpenChat={(id) => ask(chats.find((c) => c.id === id)?.title ?? "", { apps: [], files: [], tools: ["web"] }, id)}
          onRate={() => {}}
          onRegenerate={(id) => {
            setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, text: "", streaming: true, stopped: false } : m)));
            setStream({ id, words: 0 });
          }}
          onRemoveFile={(name) => setFiles((f) => f.filter((x) => x !== name))}
          onSend={(request) => ask(request.text, request)}
          onSettings={() => {}}
          onSignOut={() => {}}
          onStop={() => {
            if (!stream) return;
            setMessages((ms) =>
              ms.map((m) => {
                if (m.id !== stream.id) return m;
                const kept = m.text.replace(/[\s,.;:]+$/, "");
                return { ...m, text: kept ? `${kept}…` : "", streaming: false, stopped: true };
              }),
            );
            setStream(null);
          }}
          onUpgrade={() => {}}
          placeholders={fixtures.placeholders}
          plan="Pro"
          productName="Wren"
          projects={fixtures.listProjects}
          suggestions={fixtures.suggestions}
          tools={fixtures.tools}
          user={fixtures.user}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
