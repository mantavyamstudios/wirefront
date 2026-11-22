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
import { fail, ok } from "@wirefront/ui/wirefront/types";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as reviewFx from "@/pages/showcase/devtools-code-review/fixtures";
import { CodeReview } from "@/pages/showcase/devtools-code-review/view";
import * as docsFx from "@/pages/showcase/devtools-docs-site/fixtures";
import { DocsSite } from "@/pages/showcase/devtools-docs-site/view";
import * as issueFx from "@/pages/showcase/devtools-issue-tracker/fixtures";
import { IssueTracker } from "@/pages/showcase/devtools-issue-tracker/view";

beforeAll(() => {
  Element.prototype.getAnimations = () => [];
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.scrollTo = () => {};
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
});
afterEach(cleanup);

const wrap =
  (now: string) =>
  ({ children }: { children: ReactNode }) => (
    <WirefrontProvider locale="en-US" now={() => new Date(now)} timeZone="UTC">
      {children}
    </WirefrontProvider>
  );

describe("dev tools", () => {
  it("CodeReview comments on a line, replies, resolves and submits a review", async () => {
    const onComment = vi.fn(async () => {});
    const onResolve = vi.fn(async () => {});
    const onSubmitReview = vi.fn(async () => {});
    render(
      <CodeReview
        files={reviewFx.listPullFiles}
        me={reviewFx.me}
        onComment={onComment}
        onResolve={onResolve}
        onSubmitReview={onSubmitReview}
        people={reviewFx.people}
        pr={reviewFx.getPullRequest}
        threads={reviewFx.listReviewThreads}
        viewed={reviewFx.viewed}
      />,
      { wrapper: wrap(reviewFx.now) }
    );
    expect(
      screen.getByRole("heading", { level: 1, name: /Park poison messages/ })
    ).toBeTruthy();
    expect(screen.getByText("1 of 5 viewed")).toBeTruthy();
    expect(screen.getByText("2 open")).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Comment on line 1",
      })[0] as HTMLElement
    );
    const box = screen.getByRole("textbox", { name: "New comment" });
    fireEvent.change(box, { target: { value: "Looks right." } });
    fireEvent.click(screen.getByRole("button", { name: "Comment" }));
    expect(screen.getByText("Looks right.")).toBeTruthy();
    await waitFor(() =>
      expect(onComment).toHaveBeenCalledWith({
        file: "src/queue/consumer.ts",
        line: 1,
        side: "new",
        body: "Looks right.",
      })
    );
    expect(screen.getByText("3 open")).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Resolve" })[0] as HTMLElement
    );
    await waitFor(() =>
      expect(onResolve).toHaveBeenCalledWith(
        expect.objectContaining({ resolved: true })
      )
    );
    fireEvent.click(screen.getByRole("button", { name: /^Review/ }));
    const dialog = screen.getByRole("dialog", { name: "Finish your review" });
    fireEvent.click(
      within(dialog).getByRole("radio", { name: /Request changes/ })
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Submit review" })
    );
    await waitFor(() =>
      expect(onSubmitReview).toHaveBeenCalledWith({
        verdict: "changes",
        summary: "",
      })
    );
    expect(
      await screen.findByText("Changes requested", { selector: "div" })
    ).toBeTruthy();
  });

  it("CodeReview hides commenting when it is not wired", () => {
    render(
      <CodeReview
        files={reviewFx.listPullFiles}
        me={reviewFx.me}
        people={reviewFx.people}
        pr={reviewFx.getPullRequest}
        threads={reviewFx.listReviewThreads}
      />,
      { wrapper: wrap(reviewFx.now) }
    );
    expect(
      screen.queryByRole("button", { name: /Comment on line/ })
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /^Review/ })).toBeNull();
  });

  it("DocsSite navigates pages, switches code language and records feedback", async () => {
    const onFeedback = vi.fn();
    render(
      <DocsSite
        initialPage="quickstart"
        languages={docsFx.languages}
        onFeedback={onFeedback}
        pages={docsFx.listDocsPages}
        product="Kestrel"
        topNav={docsFx.topNav}
        version="v2.4"
      />,
      { wrapper: wrap("2026-11-01T00:00:00Z") }
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Quickstart" })
    ).toBeTruthy();
    expect(screen.getByText("kst_test_", { selector: "code" })).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Python" })[0] as HTMLElement
    );
    expect(screen.getByText("pip install kestrel")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(onFeedback).toHaveBeenCalledWith("quickstart", true);
    expect((await screen.findByRole("status")).textContent).toBe(
      "Thanks! Glad it helped."
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(
      screen.queryByRole("heading", { level: 1, name: "Quickstart" })
    ).toBeNull();
  });

  it("DocsSite search finds a section and opens it", async () => {
    render(
      <DocsSite
        languages={docsFx.languages}
        pages={docsFx.listDocsPages}
        product="Kestrel"
      />,
      { wrapper: wrap("2026-11-01T00:00:00Z") }
    );
    fireEvent.click(screen.getByRole("button", { name: /Search docs/ }));
    const input = await screen.findByRole("combobox", {
      name: "Search the docs",
    });
    fireEvent.change(input, { target: { value: "install" } });
    expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(
      await screen.findByRole("heading", { level: 1, name: "Quickstart" })
    ).toBeTruthy();
  });

  it("IssueTracker changes priority from the keyboard and rolls back on failure", async () => {
    const onUpdate = vi.fn(
      async ({ patch }: { patch: { priority?: number } }) =>
        patch.priority === 4 ? fail("Offline.") : undefined
    );
    render(
      <IssueTracker
        cycle={issueFx.cycle}
        issues={issueFx.listIssues}
        labels={issueFx.labels}
        me={issueFx.me}
        onUpdate={onUpdate}
        people={issueFx.people}
        team={issueFx.team}
      />,
      { wrapper: wrap(issueFx.now) }
    );
    expect(screen.getByText("6 days left")).toBeTruthy();
    const row = screen.getByRole("button", {
      name: /PLT-231.*Poison messages stall/,
    });
    row.focus();
    fireEvent.keyDown(row, { key: "2" });
    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith({
        ids: ["PLT-231"],
        patch: { priority: 2 },
      })
    );
    fireEvent.click(row);
    const detail = screen.getByRole("complementary", {
      name: "PLT-231 details",
    });
    expect(within(detail).getByText("High")).toBeTruthy();
    expect(within(detail).getByText(/set priority to High/)).toBeTruthy();
    fireEvent.keyDown(
      screen.getByRole("button", { name: /PLT-231.*Poison messages stall/ }),
      { key: "4" }
    );
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(within(detail).getByText("High")).toBeTruthy();
  });

  it("IssueTracker creates an issue and opens it", async () => {
    const onCreate = vi.fn(async () => ok({ ...issueFx.createIssue }));
    render(
      <IssueTracker
        issues={issueFx.listIssues}
        labels={issueFx.labels}
        me={issueFx.me}
        onCreate={onCreate}
        people={issueFx.people}
        team={issueFx.team}
      />,
      { wrapper: wrap(issueFx.now) }
    );
    fireEvent.click(screen.getByRole("button", { name: "New issue" }));
    expect(
      await screen.findByRole("complementary", { name: "PLT-232 details" })
    ).toBeTruthy();
    expect(onCreate).toHaveBeenCalledWith({ status: "todo" });
  });
});
