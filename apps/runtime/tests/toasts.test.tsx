// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { fail } from "@wirefront/ui/wirefront/types";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as errorFx from "@/pages/showcase/toasts-error-retry/fixtures";
import {
  createErrorToasts,
  ErrorToaster,
  notifyError,
} from "@/pages/showcase/toasts-error-retry/view";
import * as banner from "@/pages/showcase/toasts-info-banner/fixtures";
import { SystemBanner } from "@/pages/showcase/toasts-info-banner/view";
import * as uploadFx from "@/pages/showcase/toasts-progress/fixtures";
import { UploadDock } from "@/pages/showcase/toasts-progress/view";
import * as rich from "@/pages/showcase/toasts-rich/fixtures";
import {
  ActivityToaster,
  createActivityToasts,
  notifyActivity,
} from "@/pages/showcase/toasts-rich/view";
import {
  createSuccessToasts,
  notifySuccess,
  SuccessToaster,
} from "@/pages/showcase/toasts-success/view";
import {
  createUndoToasts,
  notifyUndo,
  UndoToaster,
} from "@/pages/showcase/toasts-undo/view";

beforeAll(() => {
  Element.prototype.getAnimations = () => [];
});
afterEach(cleanup);

describe("toasts", () => {
  it("SuccessToaster shows and refreshes a toast by id", async () => {
    const toasts = createSuccessToasts();
    render(<SuccessToaster toastManager={toasts} />);
    act(() => {
      notifySuccess(toasts, {
        id: "saved",
        title: "Saved",
        description: "Workspace settings updated.",
        timeout: 0,
      });
      notifySuccess(toasts, {
        id: "saved",
        title: "Saved",
        description: "Workspace settings updated.",
        timeout: 0,
      });
    });
    expect(await screen.findAllByText("Saved")).toHaveLength(1);
  });

  it("ErrorToaster retries, shows the new reason, then turns into the success toast", async () => {
    const toasts = createErrorToasts();
    let attempt = 0;
    const retry = vi.fn(async () =>
      attempt++ === 0 ? fail("Still unreachable.") : undefined
    );
    render(<ErrorToaster toastManager={toasts} />);
    act(() => {
      notifyError(toasts, { ...errorFx.inviteFailed, retry });
    });
    expect(
      (await screen.findAllByText("Couldn’t send invite")).length
    ).toBeGreaterThan(0);
    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));
    expect(
      (await screen.findAllByText("Still unreachable.")).length
    ).toBeGreaterThan(0);
    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));
    expect((await screen.findAllByText("Invite sent")).length).toBeGreaterThan(
      0
    );
    expect(retry).toHaveBeenCalledTimes(2);
  });

  it("UndoToaster runs the undo", async () => {
    const toasts = createUndoToasts();
    const undo = vi.fn();
    render(<UndoToaster toastManager={toasts} />);
    act(() => {
      notifyUndo(toasts, { id: "a", title: "Project archived", undo });
    });
    fireEvent.click(await screen.findByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalled();
  });

  it("ActivityToaster shows relative time and runs actions", async () => {
    const toasts = createActivityToasts();
    const onSelect = vi.fn();
    render(
      <WirefrontProvider locale="en-US" now={() => new Date(rich.now)}>
        <ActivityToaster toastManager={toasts} />
      </WirefrontProvider>
    );
    act(() => {
      notifyActivity(toasts, {
        ...(rich.activity[1] as (typeof rich.activity)[number]),
        actions: [{ label: "Review", primary: true, onSelect }],
      });
    });
    expect(
      (await screen.findAllByText("2 minutes ago")).length
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(onSelect).toHaveBeenCalled();
  });

  it("SystemBanner dismisses and comes back when dismissing fails", async () => {
    render(
      <SystemBanner
        announcement={banner.getAnnouncement}
        onDismiss={async () => fail("Nope")}
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss announcement" })
    );
    await waitFor(() =>
      expect(
        screen.getByRole("region", { name: "System announcement" })
      ).toBeTruthy()
    );
    expect(
      screen.getByRole("link", { name: "Learn more" }).getAttribute("href")
    ).toBe("#status");
  });

  it("UploadDock counts finished uploads and cancels", () => {
    const onCancel = vi.fn();
    const { rerender } = render(
      <UploadDock onCancel={onCancel} uploads={uploadFx.uploads} />
    );
    expect(screen.getByText("Uploading 0 of 2")).toBeTruthy();
    expect(screen.getByText("8.1 MB")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel Q3-roadmap.pdf" })
    );
    expect(onCancel).toHaveBeenCalledWith("u2");
    rerender(
      <UploadDock
        uploads={uploadFx.uploads.map((u) => ({ ...u, progress: 1 }))}
      />
    );
    expect(screen.getByText("Uploads complete")).toBeTruthy();
  });
});
