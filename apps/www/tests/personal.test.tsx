// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail, ok } from "@wirefront/ui/wirefront/types";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as habitsFx from "@/pages/showcase/personal-habits/fixtures";
import { Habits } from "@/pages/showcase/personal-habits/view";
import * as moneyFx from "@/pages/showcase/personal-money/fixtures";
import { Money } from "@/pages/showcase/personal-money/view";
import * as musicFx from "@/pages/showcase/personal-music-player/fixtures";
import { MusicPlayer } from "@/pages/showcase/personal-music-player/view";

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
  <WirefrontProvider currency="USD" locale="en-US" now={() => new Date(now)} timeZone="UTC">
    {children}
  </WirefrontProvider>
);

describe("personal", () => {
  it("Money greets by time of day, filters by category and pays a bill", async () => {
    const onPayBill = vi.fn(async () => ok(moneyFx.payBill));
    render(<Money accounts={moneyFx.listAccounts} bills={moneyFx.listBills} budgets={moneyFx.listBudgets} onPayBill={onPayBill} productName={moneyFx.productName} transactions={moneyFx.listTransactions} user={moneyFx.user} />, { wrapper: wrap(moneyFx.now) });
    expect(screen.getByRole("heading", { level: 2, name: "Evening, Ines" })).toBeTruthy();
    expect(screen.getAllByText("Today").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Pay Fernway Fiber" }));
    await waitFor(() => expect(onPayBill).toHaveBeenCalledWith({ billId: "b2" }));
    expect(await screen.findByRole("button", { name: "Fernway Fiber paid" })).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search transactions" }), { target: { value: "nothing-like-this" } });
    expect(screen.getByText("Nothing matches")).toBeTruthy();
  });

  it("Money is read-only without onPayBill", () => {
    render(<Money accounts={moneyFx.listAccounts} bills={moneyFx.listBills} budgets={moneyFx.listBudgets} productName={moneyFx.productName} transactions={moneyFx.listTransactions} user={moneyFx.user} />, { wrapper: wrap("2026-10-24T08:00:00Z") });
    expect(screen.getByRole("heading", { level: 2, name: "Morning, Ines" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Pay / })).toBeNull();
  });

  it("Habits ticks a habit, rolls back a failed log and adds a habit", async () => {
    const onLog = vi.fn(async () => fail("Could not save"));
    const onCreate = vi.fn(async () => ok(habitsFx.createHabit));
    render(<Habits habits={habitsFx.listHabits} onCreate={onCreate} onLog={onLog} productName={habitsFx.productName} suggestions={habitsFx.suggestions} weekStart={habitsFx.weekStart} />, { wrapper: wrap(habitsFx.now) });
    expect(screen.getByRole("heading", { level: 2, name: "Saturday, Oct 24" })).toBeTruthy();
    const tick = screen.getByRole("button", { name: "Walk 8,000 steps" });
    expect(tick.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(tick);
    await waitFor(() => expect(onLog).toHaveBeenCalledWith({ habitId: "h4", date: "2026-10-24", value: 1 }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Walk 8,000 steps" }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: /New habit/ }));
    const chips = await screen.findAllByRole("button", { name: "Meditate" });
    fireEvent.click(chips.find((b) => !b.hasAttribute("aria-pressed")) as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "Add habit" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({ name: "Meditate", icon: "meditate", tone: "violet", time: "morning", goal: undefined }));
  });

  it("Habits hides ticking and adding when not wired", () => {
    render(<Habits habits={habitsFx.listHabits} productName={habitsFx.productName} weekStart={habitsFx.weekStart} />, { wrapper: wrap(habitsFx.now) });
    expect(screen.queryByRole("button", { name: "Walk 8,000 steps" })).toBeNull();
    expect(screen.queryByRole("button", { name: /New habit/ })).toBeNull();
  });

  it("MusicPlayer reports play, seek, next and like", async () => {
    const onPlayingChange = vi.fn();
    const onSeek = vi.fn();
    const onTrackChange = vi.fn();
    const onToggleLike = vi.fn(async () => {});
    render(<MusicPlayer appName={musicFx.appName} likedIds={musicFx.listLikedTracks} onPlayingChange={onPlayingChange} onSeek={onSeek} onToggleLike={onToggleLike} onTrackChange={onTrackChange} playing={false} playlists={musicFx.listPlaylists} position={47} tracks={musicFx.listTracks} />, { wrapper: wrap("2026-10-24T10:00:00Z") });
    expect(screen.getByRole("heading", { level: 2, name: "Paper Lanterns" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(onPlayingChange).toHaveBeenCalledWith(true);
    fireEvent.keyDown(screen.getByRole("slider", { name: "Seek" }), { key: "ArrowRight" });
    expect(onSeek).toHaveBeenCalledWith(52);
    fireEvent.click(screen.getAllByRole("button", { name: "Next" })[0] as HTMLElement);
    expect(onTrackChange).toHaveBeenCalledWith(musicFx.listTracks[1]?.id);
    fireEvent.click(screen.getByRole("button", { name: "Remove from liked songs" }));
    await waitFor(() => expect(onToggleLike).toHaveBeenCalledWith({ trackId: musicFx.listTracks[1]?.id, liked: false }));
    expect(screen.getByRole("button", { name: "Add to liked songs" })).toBeTruthy();
  });

  it("MusicPlayer moves on when the track ends", () => {
    const onTrackChange = vi.fn();
    const first = musicFx.listTracks[0];
    if (!first) throw new Error("fixture");
    render(<MusicPlayer appName={musicFx.appName} onPlayingChange={() => {}} onSeek={() => {}} onTrackChange={onTrackChange} playing playlists={musicFx.listPlaylists} position={first.duration} tracks={musicFx.listTracks} />, { wrapper: wrap("2026-10-24T10:00:00Z") });
    expect(onTrackChange).toHaveBeenCalledWith(musicFx.listTracks[1]?.id);
  });

  it("MusicPlayer keeps rendering when likedIds is left out", () => {
    const base = { appName: musicFx.appName, onPlayingChange: () => {}, onSeek: () => {}, onTrackChange: () => {}, playing: true, playlists: musicFx.listPlaylists, tracks: musicFx.listTracks };
    const { rerender } = render(<MusicPlayer {...base} position={10} />, { wrapper: wrap("2026-10-24T10:00:00Z") });
    rerender(<MusicPlayer {...base} position={11} />);
    expect(screen.getByRole("slider", { name: "Seek" }).getAttribute("aria-valuenow")).toBe("11");
  });
});
