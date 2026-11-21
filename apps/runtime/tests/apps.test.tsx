// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail, ok } from "@wirefront/ui/wirefront/types";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as driveFx from "@/pages/showcase/apps-drive/fixtures";
import { Drive } from "@/pages/showcase/apps-drive/view";
import * as folderFx from "@/pages/showcase/apps-folder-view/fixtures";
import { FolderView } from "@/pages/showcase/apps-folder-view/view";
import * as helpFx from "@/pages/showcase/apps-help-centre/fixtures";
import { HelpCentre } from "@/pages/showcase/apps-help-centre/view";
import * as mailFx from "@/pages/showcase/apps-mail/fixtures";
import { Mail } from "@/pages/showcase/apps-mail/view";
import * as notesFx from "@/pages/showcase/apps-notes/fixtures";
import { Notes } from "@/pages/showcase/apps-notes/view";
import * as chatFx from "@/pages/showcase/apps-team-chat/fixtures";
import { TeamChat } from "@/pages/showcase/apps-team-chat/view";
import * as callFx from "@/pages/showcase/apps-video-call/fixtures";
import { VideoCall } from "@/pages/showcase/apps-video-call/view";

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

describe("apps", () => {
  it("Drive stars a folder optimistically and rolls back on failure", async () => {
    const onToggleStar = vi.fn(async () => fail("Could not star"));
    render(<Drive folders={driveFx.listFolders} members={driveFx.members} onToggleStar={onToggleStar} workspace={driveFx.workspace} />, { wrapper: wrap(driveFx.now) });
    const star = screen.getAllByRole("button", { name: "Star User research" })[0] as HTMLElement;
    fireEvent.click(star);
    await waitFor(() => expect(onToggleStar).toHaveBeenCalledWith({ id: "research", starred: true }));
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Star User research" }).length).toBeGreaterThan(0));
  });

  it("Drive creates a folder and hides creation when not wired", async () => {
    const onCreateFolder = vi.fn(async () => ok(driveFx.createFolder));
    const { unmount } = render(<Drive folders={driveFx.listFolders} members={driveFx.members} onCreateFolder={onCreateFolder} workspace={driveFx.workspace} />, { wrapper: wrap(driveFx.now) });
    fireEvent.click(screen.getAllByRole("button", { name: /New folder/ })[0] as HTMLElement);
    await waitFor(() => expect(onCreateFolder).toHaveBeenCalled());
    expect((await screen.findAllByText(driveFx.createFolder.name)).length).toBeGreaterThan(0);
    unmount();
    render(<Drive folders={driveFx.listFolders} members={driveFx.members} workspace={driveFx.workspace} />, { wrapper: wrap(driveFx.now) });
    expect(screen.queryByRole("button", { name: /New folder/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Star / })).toBeNull();
  });

  it("FolderView selects files and deletes them", async () => {
    const onDelete = vi.fn(async () => {});
    render(<FolderView files={folderFx.getFolder.files} folders={folderFx.getFolder.folders} me={folderFx.me} members={folderFx.members} name={folderFx.getFolder.name} onDelete={onDelete} path={folderFx.path} workspace={folderFx.workspace} />, { wrapper: wrap(folderFx.now) });
    fireEvent.click(screen.getAllByRole("checkbox", { name: /Brand guidelines v3/ })[0] as HTMLElement);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith({ folderId: expect.any(String), ids: folderFx.getFolder.files.map((f) => f.id) }));
    expect(await screen.findByText(`Moved ${folderFx.getFolder.files.length} files to trash`)).toBeTruthy();
  });

  it("Notes opens a note, edits the title and reports the change", () => {
    const onChange = vi.fn();
    render(<Notes folders={notesFx.listNoteFolders} initialNoteId="n1" notes={notesFx.listNotes} onChange={onChange} />, { wrapper: wrap(notesFx.now) });
    const title = screen.getByRole("textbox", { name: "Title" }) as HTMLInputElement;
    expect(title.value).toBe("Lisbon in May");
    fireEvent.change(title, { target: { value: "Lisbon in June" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: "n1", title: "Lisbon in June" }));
  });

  it("HelpCentre searches, opens an article and records feedback", async () => {
    const onFeedback = vi.fn(async () => {});
    render(<HelpCentre articles={helpFx.listArticles} categories={helpFx.listCategories} onFeedback={onFeedback} productName="Ledger" />, { wrapper: wrap("2026-10-24T10:00:00Z") });
    const search = screen.getAllByRole("combobox", { name: "Search help articles" })[0] as HTMLElement;
    fireEvent.change(search, { target: { value: "payouts take" } });
    fireEvent.click(await screen.findByRole("option", { name: /How long do payouts take/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "How long do payouts take?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    await waitFor(() => expect(onFeedback).toHaveBeenCalledWith(expect.objectContaining({ articleId: "payout-timing", helpful: true })));
  });

  it("VideoCall toggles the mic and sends chat", async () => {
    const onToggleMic = vi.fn();
    const onSendMessage = vi.fn(async () => {});
    render(<VideoCall meetingCode={callFx.meetingCode} messages={callFx.messages} onSendMessage={onSendMessage} onToggleMic={onToggleMic} participants={callFx.participants} startedAt={callFx.getCall.startedAt} title={callFx.getCall.title} you={callFx.you} />, { wrapper: wrap(callFx.now) });
    fireEvent.click(screen.getByRole("button", { name: "Mute" }));
    expect(onToggleMic).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Unmute" })).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: /^Chat/ })[0] as HTMLElement);
    const box = await screen.findByRole("textbox", { name: "Message everyone" });
    fireEvent.change(box, { target: { value: "Back in 5" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(onSendMessage).toHaveBeenCalledWith({ text: "Back in 5" }));
  });

  it("Mail opens a thread, archives it with undo and replies", async () => {
    const onUpdateThread = vi.fn(async () => {});
    const onReply = vi.fn(async ({ body }: { threadId: string; body: string; files: File[] }) => ok({ id: "r1", from: mailFx.account, to: "to Jonas", sentAt: mailFx.now, body: [body] }));
    render(<Mail account={mailFx.account} labels={mailFx.listLabels} onReply={onReply} onUpdateThread={onUpdateThread} threads={mailFx.listThreads} />, { wrapper: wrap(mailFx.now) });
    const first = mailFx.listThreads[0];
    if (!first) throw new Error("fixture");
    expect(screen.getByRole("heading", { level: 1, name: first.subject })).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: new RegExp(first.subject.slice(0, 12)) })[0] as HTMLElement);
    await waitFor(() => expect(onUpdateThread).toHaveBeenCalledWith({ id: first.id, patch: { unread: false } }));
    const reply = screen.getByRole("textbox", { name: /^Reply to/ });
    fireEvent.change(reply, { target: { value: "Thanks, see you Thursday." } });
    fireEvent.click(screen.getByRole("button", { name: /^Send/ }));
    await waitFor(() => expect(onReply).toHaveBeenCalledWith({ threadId: first.id, body: "Thanks, see you Thursday.", files: [] }));
    expect(await screen.findByText("Reply sent")).toBeTruthy();
    fireEvent.click(within(screen.getByRole("region", { name: "Conversation" })).getByRole("button", { name: "Archive" }));
    await waitFor(() => expect(onUpdateThread).toHaveBeenCalledWith({ id: first.id, patch: { folder: "archive" } }));
    fireEvent.click(await screen.findByRole("button", { name: "Undo" }));
    await waitFor(() => expect(onUpdateThread).toHaveBeenCalledWith({ id: first.id, patch: { folder: "inbox" } }));
  });

  it("Mail is read-only without actions", () => {
    render(<Mail account={mailFx.account} labels={mailFx.listLabels} threads={mailFx.listThreads} />, { wrapper: wrap(mailFx.now) });
    expect(screen.queryByRole("button", { name: /Compose/ })).toBeNull();
    expect(within(screen.getByRole("region", { name: "Conversation" })).queryByRole("button", { name: "Archive" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: /^Reply to/ })).toBeNull();
  });

  it("TeamChat sends a message, reacts and reverts a failed save", async () => {
    const onSendMessage = vi.fn(async ({ channelId, text }: { channelId: string; text: string }) => ok({ id: `x-${channelId}`, author: chatFx.me, sentAt: chatFx.now, text }));
    const onToggleReaction = vi.fn(async () => {});
    const onToggleSaved = vi.fn(async () => fail("Could not save"));
    render(<TeamChat channels={chatFx.listChannels} me={chatFx.me} onSendMessage={onSendMessage} onToggleReaction={onToggleReaction} onToggleSaved={onToggleSaved} people={chatFx.people} workspace={chatFx.workspace} />, { wrapper: wrap(chatFx.now) });
    expect(screen.getByRole("heading", { level: 2, name: "design" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 4, name: "Today" }).length).toBe(1);
    const box = screen.getByRole("textbox", { name: "Message #design" });
    fireEvent.change(box, { target: { value: "Ship **it**" } });
    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() => expect(onSendMessage).toHaveBeenCalledWith({ channelId: "design", text: "Ship **it**", file: undefined }));
    expect(await screen.findByText("it", { selector: "strong" })).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "React with ✅" })[0] as HTMLElement);
    await waitFor(() => expect(onToggleReaction).toHaveBeenCalledWith(expect.objectContaining({ channelId: "design", emoji: "✅" })));
    const saves = screen.getAllByRole("button", { name: "Save for later" }).length;
    fireEvent.click(screen.getAllByRole("button", { name: "Save for later" })[0] as HTMLElement);
    await waitFor(() => expect(onToggleSaved).toHaveBeenCalled());
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Save for later" }).length).toBe(saves);
  });

  it("TeamChat jumps to a channel and is read-only without actions", async () => {
    render(<TeamChat channels={chatFx.listChannels} me={chatFx.me} people={chatFx.people} workspace={chatFx.workspace} />, { wrapper: wrap(chatFx.now) });
    expect(screen.queryByRole("textbox", { name: /^Message/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Create a channel" })).toBeNull();
    expect(screen.queryByRole("button", { name: /^React with/ })).toBeNull();
    fireEvent.keyDown(screen.getByRole("main"), { key: "k", metaKey: true });
    const dialog = await screen.findByRole("dialog", { name: "Jump to a conversation" });
    const input = within(dialog).getByRole("combobox");
    fireEvent.change(input, { target: { value: "launch" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(await screen.findByRole("heading", { level: 2, name: "launches" })).toBeTruthy();
  });
});
