// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the empty-state screens.
 */
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { NotFound } from "@/pages/showcase/empty-404/view";
import { EndOfFeed } from "@/pages/showcase/empty-end-of-feed/view";
import { FirstProject } from "@/pages/showcase/empty-first-project/view";
import { InboxZero } from "@/pages/showcase/empty-inbox-zero/view";
import { Maintenance } from "@/pages/showcase/empty-maintenance/view";
import { NoFiles } from "@/pages/showcase/empty-no-files/view";
import { NoTeam } from "@/pages/showcase/empty-no-team/view";
import { Offline } from "@/pages/showcase/empty-offline/view";
import { EmptyTrash } from "@/pages/showcase/empty-trash/view";

// The particle field draws on a canvas, which jsdom doesn't implement.
vi.mock("@wirefront/ui/particle-field", () => ({ ParticleField: () => null }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("empty states hide what isn't wired", () => {
  it("shows only the controls whose props are given", () => {
    render(
      <>
        <FirstProject onCreateProject={() => {}} />
        <EndOfFeed />
        <EmptyTrash retentionDays={14} />
        <NotFound />
        <NoTeam userName="Ada" />
      </>,
    );
    expect(screen.getByRole("button", { name: /Create project/ })).toBeTruthy();
    for (const name of [/Import from/, /Refresh/, /Back to projects/, /Go back/, /Take me home/, /Invite by email/, /Copy/])
      expect(screen.queryByRole("button", { name }) ?? screen.queryByRole("link", { name })).toBeNull();
    expect(screen.getByText("Items here are permanently removed after 14 days.")).toBeTruthy();
  });
});

describe("FirstProject and NotFound", () => {
  it("call back into the app and link through its router", () => {
    const onCreateProject = vi.fn();
    const onImport = vi.fn();
    const onBack = vi.fn();
    render(
      <>
        <FirstProject onCreateProject={onCreateProject} onImport={onImport} />
        <NotFound homeHref="/home" onBack={onBack} />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Create project/ }));
    fireEvent.click(screen.getByRole("button", { name: /Import from/ }));
    fireEvent.click(screen.getByRole("button", { name: /Go back/ }));
    expect(onCreateProject).toHaveBeenCalled();
    expect(onImport).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /Take me home/ }).getAttribute("href")).toBe("/home");
  });
});

describe("EndOfFeed and Offline", () => {
  it("refreshes and shows a failure", async () => {
    const onRefresh = vi.fn(async () => {
      throw new Error("Couldn’t load newer events.");
    });
    render(<EndOfFeed onRefresh={onRefresh} />);
    fireEvent.click(screen.getByRole("button", { name: /Refresh/ }));
    expect((await screen.findByRole("alert")).textContent).toBe("Couldn’t load newer events.");
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("retries the connection and says when it's still offline", async () => {
    let finish: (ok: boolean) => void = () => {};
    const onRetry = vi.fn(() => new Promise<void>((resolve, reject) => (finish = (ok) => (ok ? resolve() : reject(new Error("offline"))))));
    render(<Offline onRetry={onRetry} tips={["Tip"]} />);
    fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
    expect(screen.getByRole("button", { name: /Try again/ }).hasAttribute("disabled")).toBe(true);
    await act(async () => finish(false));
    expect(await screen.findByText("Still offline. We’ll keep trying.")).toBeTruthy();
  });
});

describe("InboxZero", () => {
  it("formats the last message time, counts cleared mail and snoozes for the configured hours", async () => {
    const onSnooze = vi.fn(async () => {});
    render(
      <WirefrontProvider locale="en-US" timeZone="UTC">
        <InboxZero clearedThisWeek={1204} illustration="/x.png" lastMessageAt="2026-10-24T08:42:00Z" onSnooze={onSnooze} snoozeHours={2} />
      </WirefrontProvider>,
    );
    expect(screen.getByText(/Nothing new since 8:42 AM/)).toBeTruthy();
    expect(screen.getByText("1,204 cleared")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /View archive/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Snooze new mail/ }));
    await waitFor(() => expect(onSnooze).toHaveBeenCalledWith({ hours: 2 }));
    expect(await screen.findByText("New-mail notifications paused for 2 hours.")).toBeTruthy();
  });
});

describe("Maintenance", () => {
  it("counts down from the provider's clock and says when it's overdue", () => {
    const at = (iso: string) => () => new Date(iso);
    const { unmount } = render(
      <WirefrontProvider now={at("2026-10-24T12:06:00Z")}>
        <Maintenance endsAt="2026-10-24T12:18:00Z" startedAt="2026-10-24T12:00:00Z" />
      </WirefrontProvider>,
    );
    expect(screen.getByText("12:00")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Subscribe/ })).toBeNull();
    unmount();
    render(
      <WirefrontProvider now={at("2026-10-24T12:30:00Z")}>
        <Maintenance endsAt="2026-10-24T12:18:00Z" startedAt="2026-10-24T12:00:00Z" />
      </WirefrontProvider>,
    );
    expect(screen.getByText("Any moment now")).toBeTruthy();
  });
});

describe("NoTeam", () => {
  it("copies the invite link and says when copying fails", async () => {
    const writeText = vi.fn(async () => {});
    Object.assign(navigator, { clipboard: { writeText } });
    const { rerender } = render(<NoTeam inviteUrl="https://example.com/join/abc" settingsHref="/settings" userName="Ada" />);
    fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("https://example.com/join/abc"));
    expect(await screen.findByRole("button", { name: /Copied/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: "workspace settings" }).getAttribute("href")).toBe("/settings");

    writeText.mockRejectedValueOnce(new Error("denied"));
    rerender(<NoTeam inviteUrl="https://example.com/join/abc" key="again" userName="Ada" />);
    fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
    expect((await screen.findByRole("alert")).textContent).toContain("Couldn’t copy");
  });
});

describe("NoFiles", () => {
  const pick = (files: File[]) =>
    fireEvent.change(screen.getByLabelText("Choose files", { selector: "input" }), { target: { files } });

  it("uploads the chosen files, refuses ones over the limit and shows upload failures", async () => {
    const onUpload = vi.fn(async () => {
      throw new Error("Storage is full.");
    });
    render(<NoFiles maxSizeMb={1} onUpload={onUpload} />);
    const big = new File([new Uint8Array(2 * 1024 * 1024)], "huge.pdf");
    pick([big]);
    expect(screen.getByRole("alert").textContent).toBe("huge.pdf is larger than 1 MB.");
    expect(onUpload).not.toHaveBeenCalled();

    const small = new File(["x"], "note.txt");
    pick([small]);
    await waitFor(() => expect(onUpload).toHaveBeenCalledWith([small]));
    expect((await screen.findByRole("alert")).textContent).toBe("Storage is full.");
  });
});
