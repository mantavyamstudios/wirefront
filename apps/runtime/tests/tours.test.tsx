// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { fail } from "@wirefront/ui/wirefront/types";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as arrowFx from "@/pages/showcase/tours-arrow-tooltip/fixtures";
import { TooltipTour } from "@/pages/showcase/tours-arrow-tooltip/view";
import * as beaconFx from "@/pages/showcase/tours-beacon/fixtures";
import { FeatureBeacon } from "@/pages/showcase/tours-beacon/view";
import * as checklistFx from "@/pages/showcase/tours-checklist/fixtures";
import { SetupChecklist } from "@/pages/showcase/tours-checklist/view";
import * as tipFx from "@/pages/showcase/tours-inline-hint/fixtures";
import { TipCard } from "@/pages/showcase/tours-inline-hint/view";
import * as spotFx from "@/pages/showcase/tours-spotlight/fixtures";
import { SpotlightTour } from "@/pages/showcase/tours-spotlight/view";
import * as welcomeFx from "@/pages/showcase/tours-welcome-carousel/fixtures";
import { WelcomeTour } from "@/pages/showcase/tours-welcome-carousel/view";

beforeAll(() => {
  Element.prototype.getAnimations = () => [];
  Element.prototype.scrollIntoView = () => {};
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

function Targets({ ids }: { ids: string[] }) {
  return (
    <div>
      {ids.map((id) => (
        <button data-tour={id} key={id} type="button">
          {id}
        </button>
      ))}
    </div>
  );
}

describe("tours", () => {
  it("WelcomeTour steps forward, back and by dot, and reports a finished tour", async () => {
    const onComplete = vi.fn();
    render(<WelcomeTour onComplete={onComplete} steps={welcomeFx.steps} />);
    expect(await screen.findByText("Welcome to Orbit.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      screen.getByText("Projects are how you organise work.")
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Welcome to Orbit.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Go to step 4" }));
    expect(
      screen
        .getByRole("button", { name: "Go to step 4" })
        .getAttribute("aria-current")
    ).toBe("step");
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(true));
  });

  it("WelcomeTour reports a skipped tour", async () => {
    const onComplete = vi.fn();
    render(<WelcomeTour onComplete={onComplete} steps={welcomeFx.steps} />);
    fireEvent.click(await screen.findByRole("button", { name: "Skip" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(false));
  });

  it("SpotlightTour walks the targets and closes on Escape", async () => {
    const onClose = vi.fn();
    render(
      <>
        <Targets ids={spotFx.steps.map((s) => s.target)} />
        <SpotlightTour onClose={onClose} open steps={spotFx.steps} />
      </>
    );
    const dialog = await screen.findByRole("dialog", {
      name: /Search anything/,
    });
    expect(dialog).toBeTruthy();
    expect(screen.getByText("Step 1 of 4")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Start a project.")).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it("SpotlightTour finishes on the last step", async () => {
    const onClose = vi.fn();
    const one = spotFx.steps.slice(0, 1);
    render(
      <>
        <Targets ids={["search"]} />
        <SpotlightTour onClose={onClose} open steps={one} />
      </>
    );
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it("TooltipTour anchors to each target and reports the active one", async () => {
    const onClose = vi.fn();
    const onStepChange = vi.fn();
    render(
      <>
        <Targets ids={arrowFx.steps.map((s) => s.target)} />
        <TooltipTour
          onClose={onClose}
          onStepChange={onStepChange}
          open
          steps={arrowFx.steps}
        />
      </>
    );
    expect(await screen.findByText("Filter by status.")).toBeTruthy();
    expect(onStepChange).toHaveBeenLastCalledWith("status");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("See one person’s load.")).toBeTruthy();
    expect(onStepChange).toHaveBeenLastCalledWith("assignee");
    fireEvent.click(screen.getByRole("button", { name: "Close tips" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledWith(false));
  });

  it("FeatureBeacon opens its hint and dismisses by id", async () => {
    const onDismiss = vi.fn();
    const [hint] = beaconFx.listUnseenHints;
    if (!hint) throw new Error("fixture missing");
    render(
      <div className="relative">
        <FeatureBeacon hint={hint} onDismiss={onDismiss} />
      </div>
    );
    fireEvent.click(
      screen.getByRole("button", { name: `Hint: ${hint.title}` })
    );
    expect(await screen.findByText(hint.body)).toBeTruthy();
    expect(screen.getByText(/New · April 26/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(onDismiss).toHaveBeenCalledWith("stack");
  });

  it("TipCard renders actions only when wired and dismisses by id", () => {
    const onDismiss = vi.fn();
    const { rerender } = render(
      <TipCard onDismiss={onDismiss} tip={tipFx.getNextTip} />
    );
    expect(screen.getByRole("complementary", { name: "Tip" })).toBeTruthy();
    expect(screen.getByText("Tip · 1 of 8")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Try it" })).toBeNull();
    expect(screen.queryByRole("link", { name: /See all tips/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss tip" }));
    expect(onDismiss).toHaveBeenCalledWith("group-by-team");
    const onTry = vi.fn();
    rerender(
      <TipCard
        allHref="/tips"
        onDismiss={onDismiss}
        onTry={onTry}
        tip={tipFx.getNextTip}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Try it" }));
    expect(onTry).toHaveBeenCalled();
    expect(
      screen.getByRole("link", { name: /See all tips/ }).getAttribute("href")
    ).toBe("/tips");
    rerender(<TipCard onDismiss={onDismiss} />);
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("SetupChecklist ticks optimistically and rolls back on failure", async () => {
    const onToggle = vi.fn(async ({ id }: { id: string }) =>
      id === "api-key" ? fail("Couldn’t save.") : undefined
    );
    render(
      <SetupChecklist onToggle={onToggle} tasks={checklistFx.listSetupTasks} />
    );
    expect(screen.getByText("2 of 5 complete")).toBeTruthy();
    const theme = screen.getByRole("checkbox", {
      name: /Pick a theme/,
    }) as HTMLInputElement;
    fireEvent.click(theme);
    await waitFor(() =>
      expect(screen.getByText("3 of 5 complete")).toBeTruthy()
    );
    expect(onToggle).toHaveBeenCalledWith({ id: "theme", done: true });
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Generate an API key/ })
    );
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("3 of 5 complete")).toBeTruthy();
    expect(
      (
        screen.getByRole("checkbox", {
          name: /Generate an API key/,
        }) as HTMLInputElement
      ).checked
    ).toBe(false);
  });

  it("SetupChecklist offers hide once everything is done", () => {
    const onHide = vi.fn();
    const all = checklistFx.listSetupTasks.map((x) => ({ ...x, done: true }));
    render(<SetupChecklist onHide={onHide} tasks={all} />);
    expect(screen.getByText("You’re set. Great work.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Hide for good" }));
    expect(onHide).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Get set up/ }));
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});
