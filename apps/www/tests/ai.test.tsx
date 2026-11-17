// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail } from "@wirefront/ui/wirefront/types";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as assistantFx from "@/pages/showcase/ai-assistant-start/fixtures";
import { AssistantStart } from "@/pages/showcase/ai-assistant-start/view";
import * as docFx from "@/pages/showcase/ai-co-writing-doc/fixtures";
import { CoWritingDoc } from "@/pages/showcase/ai-co-writing-doc/view";
import * as conductorFx from "@/pages/showcase/ai-conductor/fixtures";
import type { ConductorMessage, Helper } from "@/pages/showcase/ai-conductor/schema";
import { Conductor } from "@/pages/showcase/ai-conductor/view";
import * as benchFx from "@/pages/showcase/ai-prompt-test-bench/fixtures";
import { PromptTestBench } from "@/pages/showcase/ai-prompt-test-bench/view";
import * as runFx from "@/pages/showcase/ai-run-replay/fixtures";
import type { AgentRun } from "@/pages/showcase/ai-run-replay/schema";
import { RunReplay } from "@/pages/showcase/ai-run-replay/view";

beforeAll(() => {
  Element.prototype.getAnimations = () => [];
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.scrollTo = () => {};
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia;
});
afterEach(cleanup);

const wrap = (now: string) => ({ children }: { children: ReactNode }) => (
  <WirefrontProvider locale="en-US" now={() => new Date(now)} timeZone="UTC">
    {children}
  </WirefrontProvider>
);

describe("ai", () => {
  it("CoWritingDoc accepts a suggestion in place and rolls back a failed one", async () => {
    const [s1] = docFx.suggestions;
    if (!s1) throw new Error("fixture missing");
    const onAccept = vi.fn(async () => fail("Couldn’t apply."));
    const onReject = vi.fn(async () => {});
    const { rerender } = render(<CoWritingDoc comments={docFx.listDocComments} currentUser="theo" doc={docFx.getSharedDoc} onAcceptSuggestion={onAccept} onRejectSuggestion={onReject} people={docFx.listCollaborators} suggestion={s1} />, { wrapper: wrap(docFx.now) });
    expect(screen.getByRole("heading", { level: 1, name: /launch narrative/ })).toBeTruthy();
    expect(screen.getByText("Mina Park, Scout, and Quill")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(onAccept).toHaveBeenCalledWith({ id: "s1" });
    expect(await screen.findByRole("button", { name: "Accept" })).toBeTruthy();
    rerender(<CoWritingDoc comments={docFx.listDocComments} currentUser="theo" doc={docFx.getSharedDoc} onAcceptSuggestion={onAccept} onRejectSuggestion={onReject} people={docFx.listCollaborators} suggestion={s1} suggestionStreaming />);
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
    expect(screen.queryByRole("toolbar")).toBeNull();
  });

  it("CoWritingDoc resolves and replies to comments optimistically", async () => {
    const onResolve = vi.fn(async () => {});
    const onReply = vi.fn(async () => {});
    render(<CoWritingDoc comments={docFx.listDocComments} currentUser="theo" doc={docFx.getSharedDoc} onReplyToComment={onReply} onResolveComment={onResolve} people={docFx.listCollaborators} />, { wrapper: wrap(docFx.now) });
    const first = screen.getAllByText(/Source for this/)[0];
    expect(first).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Reply…" })[0] as HTMLElement);
    const input = screen.getByRole("textbox", { name: "Reply" });
    fireEvent.change(input, { target: { value: "Yes, add it." } });
    fireEvent.submit(input);
    expect(screen.getAllByText("Yes, add it.").length).toBeGreaterThan(0);
    await waitFor(() => expect(onReply).toHaveBeenCalledWith({ commentId: "c1", text: "Yes, add it." }));
    fireEvent.click(screen.getAllByRole("button", { name: "Resolve" })[0] as HTMLElement);
    await waitFor(() => expect(onResolve).toHaveBeenCalledWith({ id: "c1" }));
  });

  it("Conductor sends, answers a question with picks and fills the brief", async () => {
    const onSend = vi.fn(async () => {});
    const onAnswer = vi.fn(async () => {});
    const onFieldChange = vi.fn();
    const helpers: Helper[] = [{ id: "scout", name: "Scout", role: "Research", tone: "teal", status: "working", progress: 40, activity: "Reading posts" }];
    const messages: ConductorMessage[] = [
      { id: "m1", role: "agent", text: "Started.", spawned: ["scout"], updated: 2 },
      { id: "m2", role: "agent", text: "Which channels?", choices: { prompt: "Pick channels", options: ["Newsletter", "LinkedIn"] } },
    ];
    render(<Conductor agentName="Conductor" briefTitle="Launch brief" fields={conductorFx.fields} helpers={helpers} messages={messages} onAnswer={onAnswer} onFieldChange={onFieldChange} onSend={onSend} values={{ project: { value: "Orbit launch", by: "agent" } }} />);
    expect(screen.getByText("Filled 2 fields in Launch brief")).toBeTruthy();
    expect(screen.getByText("Asked Scout to help with research")).toBeTruthy();
    expect(screen.getAllByText("1 working").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Newsletter" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 1" }));
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith({ messageId: "m2", picks: ["Newsletter"] }));
    await waitFor(() => expect(screen.queryByRole("button", { name: /^Use/ })).toBeNull());
    const box = screen.getByRole("textbox", { name: "Message Conductor" });
    fireEvent.change(box, { target: { value: "Keep it warm" } });
    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() => expect(onSend).toHaveBeenCalledWith({ text: "Keep it warm" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Budget" }), { target: { value: "$40k" } });
    expect(onFieldChange).toHaveBeenCalledWith("budget", "$40k");
  });

  it("RunReplay approves the ticked recipients and shows failures with retry", async () => {
    const onDecide = vi.fn(async () => {});
    const onRecipientsChange = vi.fn();
    const run: AgentRun = { ...runFx.getRun, status: "waiting", approval: { step: 4, title: "Send renewal emails?", description: "Untick anyone." }, steps: runFx.getRun.steps.map((s, i) => ({ ...s, status: i < 4 ? "done" : i === 4 ? "waiting" : "pending" })) };
    const output = { ...runFx.getRunOutput, accounts: runFx.accounts.slice(0, 3), state: "ready" as const, email: runFx.email };
    const { rerender } = render(<RunReplay onDecide={onDecide} onRecipientsChange={onRecipientsChange} output={output} run={run} />, { wrapper: wrap("2026-01-01T00:00:00Z") });
    const card = screen.getByRole("region", { name: "Approval needed" });
    fireEvent.click(within(card).getByRole("checkbox", { name: /Theo Marsh/ }));
    expect(onRecipientsChange).toHaveBeenCalledWith(["ines@halcyon.example", "ana@copperline.example"]);
    fireEvent.click(within(card).getByRole("button", { name: "Approve & send 2" }));
    await waitFor(() => expect(onDecide).toHaveBeenCalledWith({ approve: true, recipients: ["ines@halcyon.example", "ana@copperline.example"] }));
    const onRetry = vi.fn(async () => {});
    rerender(<RunReplay onRetry={onRetry} output={output} run={{ ...run, status: "failed", approval: undefined, failure: { step: 1, toolName: "helpdesk.sentiment", message: "429 Too Many Requests" } }} />);
    expect(screen.getByText("Step 2 failed: Read recent support threads")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry step" }));
    await waitFor(() => expect(onRetry).toHaveBeenCalled());
  });

  it("AssistantStart sends with the chosen tools and apps, and shows replies", () => {
    const onSend = vi.fn();
    const onRegenerate = vi.fn();
    const props = { apps: assistantFx.listApps, chats: assistantFx.listChats, greeting: "Good afternoon", models: assistantFx.models, onNewChat: () => {}, onOpenChat: () => {}, onSend, placeholders: assistantFx.placeholders, productName: "Wren", projects: assistantFx.listProjects, suggestions: assistantFx.suggestions, tools: assistantFx.tools, user: assistantFx.user };
    const { rerender } = render(<AssistantStart {...props} messages={[]} />, { wrapper: wrap(assistantFx.now) });
    expect(screen.getByRole("heading", { name: "Good afternoon, Mara" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Postbox" }));
    fireEvent.click(screen.getByRole("button", { name: "Code" }));
    const box = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(box, { target: { value: "Catch me up" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onSend).toHaveBeenCalledWith({ text: "Catch me up", tools: ["web", "code"], apps: ["mail"], files: [], model: "wren-pro" });
    rerender(<AssistantStart {...props} messages={[{ id: "u1", role: "user", text: "Catch me up" }, { id: "a1", role: "assistant", text: "First.\n\nSecond.", steps: ["Read Postbox · 1,204 threads"] }]} onRegenerate={onRegenerate} />);
    expect(screen.getByText("Second.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(onRegenerate).toHaveBeenCalledWith("a1");
  });

  it("PromptTestBench re-runs cases, filters failures and reviews a version", async () => {
    const onRun = vi.fn();
    const onReview = vi.fn(async () => {});
    const prompt = benchFx.getPrompt;
    const versionId = prompt.versions.at(-1)?.id ?? "";
    render(<PromptTestBench onReview={onReview} onRun={onRun} onSelectPrompt={() => {}} onSelectVersion={() => {}} passMark={benchFx.passMark} prompt={prompt} prompts={benchFx.listPrompts} results={benchFx.getCaseResults} threshold={benchFx.threshold} user={benchFx.user} versionId={versionId} workspace={benchFx.workspace} />, { wrapper: wrap("2026-10-22T15:00:00Z") });
    fireEvent.click(screen.getByRole("button", { name: "Re-run all" }));
    expect(onRun).toHaveBeenCalledWith(prompt.cases.map((c) => c.id));
    const failing = Object.values(benchFx.getCaseResults).filter((r) => r.status === "fail").length;
    expect(screen.getByRole("tab", { name: new RegExp(`Failed\\s*${failing}`) })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(await screen.findByText(`approved ${versionId}`)).toBeTruthy();
    await waitFor(() => expect(onReview).toHaveBeenCalledWith({ versionId, kind: "approved", comment: "" }));
    expect(screen.getAllByRole("button", { name: /pass rate/ })).toHaveLength(prompt.versions.length);
  });
});
