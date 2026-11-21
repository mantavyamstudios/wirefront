// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { fail } from "@wirefront/ui/wirefront/types";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as activity from "@/pages/showcase/timelines-activity-feed/fixtures";
import { ActivityFeed } from "@/pages/showcase/timelines-activity-feed/view";
import * as approvals from "@/pages/showcase/timelines-approvals/fixtures";
import { MergeReadiness } from "@/pages/showcase/timelines-approvals/view";
import * as audit from "@/pages/showcase/timelines-audit/fixtures";
import { AuditTrail } from "@/pages/showcase/timelines-audit/view";
import * as changelog from "@/pages/showcase/timelines-changelog/fixtures";
import { ChangelogFeed } from "@/pages/showcase/timelines-changelog/view";
import * as commits from "@/pages/showcase/timelines-commits/fixtures";
import { CommitGraph } from "@/pages/showcase/timelines-commits/view";
import * as deploys from "@/pages/showcase/timelines-deploys/fixtures";
import { DeployHistory } from "@/pages/showcase/timelines-deploys/view";
import * as inbox from "@/pages/showcase/timelines-inbox-thread/fixtures";
import { EmailThread } from "@/pages/showcase/timelines-inbox-thread/view";
import * as notifications from "@/pages/showcase/timelines-notifications/fixtures";
import { NotificationCenter } from "@/pages/showcase/timelines-notifications/view";
import * as ops from "@/pages/showcase/timelines-pr-ops-console/fixtures";
import { ChecksConsole } from "@/pages/showcase/timelines-pr-ops-console/view";
import * as pull from "@/pages/showcase/timelines-pull-request/fixtures";
import { PullRequestPage } from "@/pages/showcase/timelines-pull-request/view";
import * as releases from "@/pages/showcase/timelines-releases/fixtures";
import { ReleasePromotion } from "@/pages/showcase/timelines-releases/view";
import * as statusPage from "@/pages/showcase/timelines-status-page/fixtures";
import { StatusPage } from "@/pages/showcase/timelines-status-page/view";

afterEach(cleanup);

const at = (now: string, ui: ReactNode) => render(<WirefrontProvider locale="en-US" now={() => new Date(now)} timeZone="UTC">{ui}</WirefrontProvider>);

describe("timelines", () => {
  it("AuditTrail shows times relative to the clock and opens events", () => {
    const onViewEvent = vi.fn();
    at(audit.now, <AuditTrail data={audit.listAuditEvents} note="kept 1 year" onViewEvent={onViewEvent} />);
    expect(screen.getByText("Last 30 days · 218 events · kept 1 year")).toBeTruthy();
    expect(screen.getByText("2 minutes ago")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /View event: James Lin deleted/ }));
    expect(onViewEvent).toHaveBeenCalledWith("ev-2");
  });

  it("ReleasePromotion computes durations and elapsed time, and runs its actions", async () => {
    const onPause = vi.fn(async () => {});
    at(releases.now, <ReleasePromotion onPause={onPause} release={releases.getRelease} />);
    expect(screen.getByText("2m 14s")).toBeTruthy();
    expect(screen.getByText("6m 42s in")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Canary 5% rollout" }).getAttribute("aria-valuenow")).toBe("62");
    expect(screen.queryByRole("button", { name: "Roll back" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(onPause).toHaveBeenCalled();
  });

  it("DeployHistory filters by environment and rolls back succeeded production deploys", async () => {
    const onRollBack = vi.fn(async () => {});
    at(deploys.now, <DeployHistory deploys={deploys.listDeploys} onRollBack={onRollBack} project="acme/web" />);
    const rollBacks = screen.getAllByRole("button", { name: /Roll back to/ });
    expect(rollBacks).toHaveLength(1);
    fireEvent.click(rollBacks[0] as HTMLElement);
    expect(onRollBack).toHaveBeenCalledWith("dpl_4f01");
    expect(screen.getByText("6m 42s")).toBeTruthy();
  });

  it("ChangelogFeed marks the newest release and labels groups", () => {
    render(<ChangelogFeed entries={changelog.listChangelog} product="Acme" />);
    expect(screen.getByRole("heading", { name: "What’s new in Acme" })).toBeTruthy();
    const latest = screen.getByRole("article", { name: "v3.4" });
    expect(within(latest).getByText("Latest")).toBeTruthy();
    expect(within(screen.getByRole("article", { name: "v3.2" })).getByRole("heading", { name: "Removed" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Subscribe/ })).toBeNull();
  });

  it("CommitGraph treats two parents as a merge and pluralises file counts", () => {
    at(commits.now, <CommitGraph branch="main" commits={commits.listCommits} repo="acme/web" />);
    expect(screen.getByText("8 files")).toBeTruthy();
    expect(screen.getAllByText("1 file")).toHaveLength(2);
    expect(screen.getByText("Merge branch 'feat/audit-log'").className).toContain("italic");
  });

  it("NotificationCenter splits today from earlier, filters and marks all read", async () => {
    const onMarkAllRead = vi.fn(async () => {});
    at(notifications.now, <NotificationCenter notifications={notifications.listNotifications} onMarkAllRead={onMarkAllRead} />);
    expect(within(screen.getByRole("heading", { name: "Notifications" }).parentElement as HTMLElement).getByText("2")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Today" })).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "Mentions" }));
    expect(screen.getAllByRole("link")).toHaveLength(1);
    fireEvent.click(screen.getByRole("radio", { name: "All" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));
    expect(onMarkAllRead).toHaveBeenCalled();
    expect(screen.queryByText(/Unread:/)).toBeNull();
  });

  it("ActivityFeed groups by day and loads older events", async () => {
    const onLoadMore = vi.fn(async () => {});
    at(activity.now, <ActivityFeed events={activity.listActivity.events} hasMore onLoadMore={onLoadMore} />);
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Today", "Yesterday", "Earlier"]);
    fireEvent.click(screen.getByRole("button", { name: "Load older activity" }));
    expect(onLoadMore).toHaveBeenCalled();
  });

  it("StatusPage derives the banner, uptime and incident durations", () => {
    at(statusPage.now, <StatusPage data={statusPage.getStatus} host="status.acme.dev" product="Acme" />);
    expect(screen.getByRole("status").textContent).toContain("One service is experiencing issues");
    expect(screen.getByRole("heading", { name: "All other systems operational" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Webhooks: 3 of the last 60 days with issues" })).toBeTruthy();
    expect(screen.getByText(/ongoing for 42m/)).toBeTruthy();
    expect(screen.getByText(/duration 16m/)).toBeTruthy();
  });

  it("EmailThread stars, validates and sends a reply", async () => {
    const onReply = vi.fn(async () => {});
    const onToggleStar = vi.fn(async () => fail("Couldn’t star."));
    at(activity.now, <EmailThread onReply={onReply} onToggleStar={onToggleStar} thread={inbox.getThread} />);
    expect(screen.getByText("3 messages")).toBeTruthy();
    expect(screen.getByText("2 participants")).toBeTruthy();
    expect(screen.getByText("audit-retention-proposal.pdf · 482 kB")).toBeTruthy();
    const star = screen.getByRole("button", { name: "Star thread" });
    fireEvent.click(star);
    expect(await screen.findByText("Couldn’t star.")).toBeTruthy();
    expect(star.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));
    expect(await screen.findByText("Write a reply first.")).toBeTruthy();
    expect(onReply).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: "Reply" }), { target: { value: "Yes, loop in legal." } });
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));
    await waitFor(() => expect(onReply).toHaveBeenCalledWith({ body: "Yes, loop in legal." }));
    expect(await screen.findByText("Reply sent")).toBeTruthy();
  });

  it("MergeReadiness blocks merging on failing checks", () => {
    at(approvals.now, <MergeReadiness onMerge={async () => {}} pr={approvals.getPullRequest} />);
    expect(screen.getByRole("heading", { name: "Reviewers · 2 / 4 approved" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Checks · 4 / 5 passed" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Squash and merge" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Blocked by 1 failing check(s)")).toBeTruthy();
  });

  it("PullRequestPage waits on running checks, and merges once ready", async () => {
    const { unmount } = at(pull.now, <PullRequestPage onMerge={async () => {}} pr={pull.getPullRequestDetail} />);
    expect(screen.getByRole("heading", { name: "Running 1 check(s)" })).toBeTruthy();
    expect(screen.getByText("2/2 approvals")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Squash & merge" }) as HTMLButtonElement).disabled).toBe(true);
    unmount();
    const onMerge = vi.fn(async () => {});
    const done = { ...pull.getPullRequestDetail, checks: pull.getPullRequestDetail.checks.map((c) => ({ ...c, status: "passed" as const, durationMs: c.durationMs ?? 1000 })) };
    at(pull.now, <PullRequestPage onMerge={onMerge} pr={done} />);
    expect(screen.getByRole("heading", { name: "Ready to merge" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Squash & merge" }));
    expect(onMerge).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Add reviewer" })).toBeNull();
  });

  it("ChecksConsole groups checks, collapses, and only merges a ready branch", () => {
    const onUpdateBranch = vi.fn(async () => {});
    render(<ChecksConsole onMerge={async () => {}} onUpdateBranch={onUpdateBranch} pr={ops.getPrChecks} />);
    expect(screen.getByRole("heading", { name: "Some checks were not successful" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "19 passed, 1 failed, 17 skipped of 37 checks" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Squash and merge" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Update branch" }));
    expect(onUpdateBranch).toHaveBeenCalled();
    const toggle = screen.getByRole("button", { name: "Collapse checks" });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: "Ready for review" })).toBeNull();
  });
});
