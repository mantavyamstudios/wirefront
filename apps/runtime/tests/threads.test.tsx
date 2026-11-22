// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail } from "@wirefront/ui/wirefront/types";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as rowFx from "@/pages/showcase/threads-comment-row/fixtures";
import { CommentRow } from "@/pages/showcase/threads-comment-row/view";
import * as composeFx from "@/pages/showcase/threads-compose-rich/fixtures";
import {
  applyFormat,
  RichComposer,
} from "@/pages/showcase/threads-compose-rich/view";
import * as inlineFx from "@/pages/showcase/threads-inline-thread/fixtures";
import { InlineThread } from "@/pages/showcase/threads-inline-thread/view";
import * as mentionFx from "@/pages/showcase/threads-mention-popover/fixtures";
import { MentionComposer } from "@/pages/showcase/threads-mention-popover/view";
import * as resolvedFx from "@/pages/showcase/threads-resolved/fixtures";
import { ResolvedThreads } from "@/pages/showcase/threads-resolved/view";
import * as panelFx from "@/pages/showcase/threads-side-panel/fixtures";
import { ThreadPanel } from "@/pages/showcase/threads-side-panel/view";

beforeAll(() => {
  Element.prototype.getAnimations = () => [];
  Element.prototype.scrollIntoView = () => {};
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(cleanup);

const at = (now: string) => () => new Date(now);
const wrap =
  (now: string) =>
  ({ children }: { children: ReactNode }) => (
    <WirefrontProvider locale="en-US" now={at(now)} timeZone="UTC">
      {children}
    </WirefrontProvider>
  );

describe("threads", () => {
  it("InlineThread shows the thread in the rail, appends a reply and rolls it back on failure", async () => {
    const onReply = vi.fn(async ({ body }: { body: string }) =>
      body === "nope" ? fail("Couldn’t post.") : undefined
    );
    const onResolve = vi.fn();
    render(
      <InlineThread
        anchor="Anchored passage."
        comments={inlineFx.listThreadComments}
        currentUser={{ name: "Sam Rivera" }}
        onReply={onReply}
        onResolve={onResolve}
      />,
      { wrapper: wrap(inlineFx.now) }
    );
    const rail = screen.getByRole("complementary", { name: "Comments" });
    expect(within(rail).getByText("Thread · 2 comments")).toBeTruthy();
    expect(within(rail).getByText("10 minutes ago")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Open thread, 2 comments" })
    ).toBeTruthy();
    const input = within(rail).getByRole("textbox", {
      name: "Reply to thread",
    });
    fireEvent.change(input, { target: { value: "Agreed." } });
    fireEvent.submit(input);
    expect(within(rail).getByText("Agreed.")).toBeTruthy();
    expect(within(rail).getByText("Sam Rivera")).toBeTruthy();
    await waitFor(() =>
      expect(onReply).toHaveBeenCalledWith({ body: "Agreed." })
    );
    fireEvent.change(input, { target: { value: "nope" } });
    fireEvent.submit(input);
    expect(await within(rail).findByRole("alert")).toBeTruthy();
    expect(within(rail).queryByText("nope")).toBeNull();
    fireEvent.click(
      within(rail).getByRole("button", { name: "Resolve thread" })
    );
    expect(onResolve).toHaveBeenCalled();
  });

  it("ThreadPanel replies with ⌘↵, toggles reactions and subscription", async () => {
    const onReply = vi.fn(async () => {});
    const onReact = vi.fn(async () => {});
    const onSubscribedChange = vi.fn();
    const c = panelFx.getConversation;
    render(
      <ThreadPanel
        comments={c.comments}
        currentUser={{ name: "You" }}
        onOpenChange={() => {}}
        onReact={onReact}
        onReply={onReply}
        onSubscribedChange={onSubscribedChange}
        open
        subject={c.subject}
        subscribed
      />,
      { wrapper: wrap(panelFx.now) }
    );
    const dialog = await screen.findByRole("dialog", { name: "Conversation" });
    expect(within(dialog).getByText("4 replies")).toBeTruthy();
    expect(within(dialog).getByText("3 participants")).toBeTruthy();
    expect(within(dialog).getByText("audit-q3").tagName).toBe("CODE");
    expect(within(dialog).getByText("@maya").tagName).toBe("SPAN");
    const rocket = within(dialog).getByRole("button", {
      name: "🚀 2 reactions",
    });
    expect(rocket.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(rocket);
    expect(
      within(dialog)
        .getByRole("button", { name: "🚀 1 reactions" })
        .getAttribute("aria-pressed")
    ).toBe("false");
    await waitFor(() =>
      expect(onReact).toHaveBeenCalledWith({
        commentId: "c1",
        emoji: "🚀",
        mine: false,
      })
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Subscribed" }));
    expect(onSubscribedChange).toHaveBeenCalledWith(false);
    const box = within(dialog).getByRole("textbox", { name: "Reply" });
    fireEvent.change(box, { target: { value: "Shipping tonight." } });
    fireEvent.keyDown(box, { key: "Enter", metaKey: true });
    expect(within(dialog).getByText("Shipping tonight.")).toBeTruthy();
    expect(within(dialog).getByText("5 replies")).toBeTruthy();
    await waitFor(() =>
      expect(onReply).toHaveBeenCalledWith({ body: "Shipping tonight." })
    );
  });

  it("CommentRow highlights code and mentions, hides unwired controls, toggles reactions", async () => {
    const [first, , third] = rowFx.listComments;
    if (!first || !third) throw new Error("fixture missing");
    const { rerender } = render(<CommentRow comment={third} />, {
      wrapper: wrap(rowFx.now),
    });
    expect(screen.getByText("@sam").tagName).toBe("SPAN");
    expect(screen.queryByRole("button", { name: /More actions/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reply" })).toBeNull();
    const onReact = vi.fn(async () => {});
    const onOpenReplies = vi.fn();
    rerender(
      <CommentRow
        comment={first}
        onOpenReplies={onOpenReplies}
        onReact={onReact}
        onReply={() => {}}
      />
    );
    expect(screen.getByText("~120ms").tagName).toBe("CODE");
    expect(screen.getByText("2 hours ago")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "💯 1 reaction" }));
    expect(
      screen
        .getByRole("button", { name: "💯 2 reactions" })
        .getAttribute("aria-pressed")
    ).toBe("true");
    await waitFor(() =>
      expect(onReact).toHaveBeenCalledWith({
        commentId: "c1",
        emoji: "💯",
        mine: true,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "3 replies" }));
    expect(onOpenReplies).toHaveBeenCalledWith("c1");
  });

  it("CommentRow rolls a reaction back when saving fails", async () => {
    const [first] = rowFx.listComments;
    if (!first) throw new Error("fixture missing");
    render(
      <CommentRow comment={first} onReact={async () => fail("Offline.")} />,
      { wrapper: wrap(rowFx.now) }
    );
    fireEvent.click(screen.getByRole("button", { name: "👀 2 reactions" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "👀 2 reactions" })
        .getAttribute("aria-pressed")
    ).toBe("false");
  });

  it("MentionComposer filters on @, navigates with arrows and inserts the handle", () => {
    const onMention = vi.fn();
    render(
      <MentionComposer
        defaultValue={mentionFx.draft}
        groups={mentionFx.listMentionables.groups}
        members={mentionFx.listMentionables.members}
        onMention={onMention}
      />
    );
    const box = screen.getByRole("combobox", { name: "Reply to thread" });
    expect(box.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    fireEvent.change(box, { target: { value: "Ping @" } });
    expect(screen.getAllByRole("option")).toHaveLength(7);
    fireEvent.keyDown(box, { key: "ArrowUp" });
    expect(box.getAttribute("aria-activedescendant")).toBe(
      screen.getAllByRole("option")[6]?.id
    );
    fireEvent.keyDown(box, { key: "Enter" });
    expect((box as HTMLTextAreaElement).value).toBe("Ping @design ");
    expect(onMention).toHaveBeenCalledWith("design");
    expect(box.getAttribute("aria-expanded")).toBe("false");
    fireEvent.change(box, { target: { value: "Hi @ri" } });
    fireEvent.keyDown(box, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("ResolvedThreads expands, reopens optimistically and restores on failure", async () => {
    const onReopen = vi.fn(async ({ id }: { id: string }) =>
      id === "t2" ? fail("Couldn’t reopen.") : undefined
    );
    const { threads, openCount } = resolvedFx.listResolvedThreads;
    render(
      <ResolvedThreads
        onReopen={onReopen}
        openCount={openCount}
        threads={threads}
      />,
      { wrapper: wrap(resolvedFx.now) }
    );
    expect(screen.getByText("Open · 4")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Resolved · 3" })).toBeTruthy();
    expect(screen.getByText("Resolved by James Lin")).toBeTruthy();
    const expand = screen.getAllByRole("button", { name: "Expand thread" })[0];
    if (!expand) throw new Error("no expand button");
    fireEvent.click(expand);
    expect(expand.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(
      screen.getByRole("button", { name: "Reopen thread by Maya Okafor" })
    );
    expect(screen.queryByText("Resolved by James Lin")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Reopen thread by Riya Patel" })
    );
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Reopen thread by Riya Patel" })
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Reopen thread by Maya Okafor" })
    ).toBeNull();
  });

  it("applyFormat wraps the selection, builds links and lists", () => {
    expect(applyFormat("ship it", 0, 4, "bold")).toEqual({
      text: "**ship** it",
      start: 2,
      end: 6,
    });
    expect(applyFormat("ship it", 5, 7, "code")).toEqual({
      text: "ship `it`",
      start: 6,
      end: 8,
    });
    expect(applyFormat("docs", 0, 4, "link")).toEqual({
      text: "[docs](https://)",
      start: 7,
      end: 15,
    });
    expect(applyFormat("a\nb\nc", 2, 5, "list").text).toBe("a\n- b\n- c");
  });

  it("RichComposer formats with the toolbar, sends with ⌘↵ and clears on success", async () => {
    const onSubmit = vi.fn(async () => {});
    const onRemoveAttachment = vi.fn();
    render(
      <RichComposer
        attachments={[composeFx.uploadAttachment]}
        defaultValue="hello"
        onRemoveAttachment={onRemoveAttachment}
        onSubmit={onSubmit}
        replyingTo={composeFx.replyingTo}
      />,
      { wrapper: wrap(composeFx.now) }
    );
    expect(screen.queryByRole("button", { name: "Attach" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(screen.getByText("Maya · 2 hours ago")).toBeTruthy();
    const box = screen.getByRole("textbox", {
      name: "Reply",
    }) as HTMLTextAreaElement;
    box.setSelectionRange(0, 5);
    fireEvent.click(screen.getByRole("button", { name: "Italic" }));
    expect(box.value).toBe("_hello_");
    fireEvent.click(
      screen.getByRole("button", { name: "Remove migration-plan.md" })
    );
    expect(onRemoveAttachment).toHaveBeenCalledWith("a1");
    fireEvent.keyDown(box, { key: "Enter", metaKey: true });
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ body: "_hello_" })
    );
    await waitFor(() => expect(box.value).toBe(""));
  });
});
