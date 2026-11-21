// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the card screens.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail } from "@wirefront/ui/wirefront/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as eventFixtures from "@/pages/showcase/card-event/fixtures";
import { UpcomingEvents } from "@/pages/showcase/card-event/view";
import * as integrationFixtures from "@/pages/showcase/card-integration/fixtures";
import { ConnectedServices } from "@/pages/showcase/card-integration/view";
import * as invoiceFixtures from "@/pages/showcase/card-invoice/fixtures";
import { RecentInvoices } from "@/pages/showcase/card-invoice/view";
import * as mediaFixtures from "@/pages/showcase/card-media/fixtures";
import { ArticleCards } from "@/pages/showcase/card-media/view";
import * as paymentFixtures from "@/pages/showcase/card-payment-method/fixtures";
import { PaymentMethods } from "@/pages/showcase/card-payment-method/view";
import * as pricingFixtures from "@/pages/showcase/card-pricing/fixtures";
import { PlanCards } from "@/pages/showcase/card-pricing/view";
import * as productFixtures from "@/pages/showcase/card-product/fixtures";
import { ProductCards } from "@/pages/showcase/card-product/view";
import * as profileFixtures from "@/pages/showcase/card-profile/fixtures";
import { ProfileCard } from "@/pages/showcase/card-profile/view";
import * as kpiFixtures from "@/pages/showcase/card-stat-tile/fixtures";
import { KpiOverview } from "@/pages/showcase/card-stat-tile/view";
import * as taskFixtures from "@/pages/showcase/card-task/fixtures";
import { TaskBoard } from "@/pages/showcase/card-task/view";

afterEach(cleanup);
const en = (ui: React.ReactNode, now?: string) => (
  <WirefrontProvider locale="en-US" now={now ? () => new Date(now) : undefined} timeZone="UTC">
    {ui}
  </WirefrontProvider>
);

describe("ProfileCard", () => {
  it("formats stats, links email and hides unwired actions", () => {
    render(en(<ProfileCard person={profileFixtures.getProfileSummary} />));
    expect(screen.getByText("12d")).toBeTruthy();
    expect(screen.getByRole("link", { name: "lina@orbit.so" }).getAttribute("href")).toBe("mailto:lina@orbit.so");
    expect(screen.queryByRole("button", { name: /Message/ })).toBeNull();
    expect(screen.queryByRole("link", { name: "View profile" })).toBeNull();
  });
});

describe("KpiOverview", () => {
  it("formats each kind and colours change by whether it is good", () => {
    render(en(<KpiOverview kpis={kpiFixtures.listKpis} />));
    expect(screen.getByText("$48.2K")).toBeTruthy();
    expect(screen.getByText("1.8%")).toBeTruthy();
    // Churn went down, which is good for churn.
    expect(screen.getByText("-0.6% vs the previous period, better")).toBeTruthy();
    expect(screen.getByText("+12.4% vs the previous period, better")).toBeTruthy();
  });
});

describe("PlanCards", () => {
  it("prices plans per currency, says Custom for sales plans and reports the choice", () => {
    const onChoose = vi.fn();
    render(en(<PlanCards onChoose={onChoose} plans={pricingFixtures.listPlanTiers} />));
    expect(screen.getByText("$24")).toBeTruthy();
    expect(screen.getByText("Custom")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Talk to sales" }));
    expect(onChoose).toHaveBeenCalledWith(pricingFixtures.listPlanTiers[2]);
  });
});

describe("RecentInvoices", () => {
  it("says when each invoice was due, paid, voided or how late it is", async () => {
    const onExport = vi.fn(async () => {});
    render(en(<RecentInvoices invoiceHref={(i) => `/invoices/${i.id}`} invoices={invoiceFixtures.invoices} onExport={onExport} total={142} />, invoiceFixtures.now));
    expect(screen.getByText("Due Apr 30")).toBeTruthy();
    expect(screen.getByText("Paid Apr 22")).toBeTruthy();
    expect(screen.getByText("11 days late")).toBeTruthy();
    expect(screen.getByText("Voided Apr 19")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open INV-2869" }).getAttribute("href")).toBe("/invoices/inv_2869");
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    await waitFor(() => expect(onExport).toHaveBeenCalled());
  });
});

describe("UpcomingEvents", () => {
  it("marks the event on now as live with a join link, and RSVPs optimistically", async () => {
    const onRsvp = vi.fn(async () => fail("Calendar is read-only."));
    render(en(<UpcomingEvents events={eventFixtures.listUpcomingEvents} onRsvp={onRsvp} />, eventFixtures.now));
    const live = screen.getByText("Platform weekly").closest("li") as HTMLElement;
    expect(within(live).getByText("Live")).toBeTruthy();
    expect(within(live).getByRole("link", { name: "Join" }).getAttribute("href")).toBe("https://meet.example.com/platform-weekly");
    const kickoff = screen.getByText("Q2 kickoff").closest("li") as HTMLElement;
    expect(within(kickoff).getByText("+1")).toBeTruthy();
    fireEvent.click(within(kickoff).getByRole("button", { name: "RSVP" }));
    expect(within(kickoff).getByText("Going")).toBeTruthy();
    expect((await screen.findByRole("alert")).textContent).toBe("Calendar is read-only.");
    expect(within(kickoff).getByRole("button", { name: "RSVP" })).toBeTruthy();
    expect(onRsvp).toHaveBeenCalledWith({ eventId: "kickoff", response: "accepted" });
  });
});

describe("ConnectedServices", () => {
  it("shows health and sync time, toggles a service and counts what needs attention", async () => {
    const onToggle = vi.fn(async () => {});
    render(en(<ConnectedServices onToggle={onToggle} services={integrationFixtures.listConnectedServices} />, integrationFixtures.now));
    expect(screen.getByText("2 connected · 1 needs attention")).toBeTruthy();
    expect(screen.getByText("synced 2 minutes ago")).toBeTruthy();
    expect(screen.getByText("rate-limited · retrying")).toBeTruthy();
    fireEvent.click(screen.getByRole("switch", { name: "Forge" }));
    await waitFor(() => expect(onToggle).toHaveBeenCalledWith({ id: "code", enabled: false }));
    expect(screen.getByText("1 connected")).toBeTruthy();
  });
});

describe("ArticleCards", () => {
  it("links each card and saves for later", async () => {
    const onSave = vi.fn(async () => {});
    render(en(<ArticleCards articles={mediaFixtures.listLatestArticles} onSave={onSave} />));
    expect(screen.getByRole("link", { name: /particle fields/ }).getAttribute("href")).toBe("#particle-fields");
    const save = screen.getByRole("button", { name: /Save “Building responsive/ });
    expect(save.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(save);
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ articleId: "particle-fields", saved: true }));
    expect(save.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("8 min read")).toBeTruthy();
  });
});

describe("PaymentMethods", () => {
  it("names cards for screen readers and makes another card primary", async () => {
    const onMakePrimary = vi.fn(async () => {});
    render(en(<PaymentMethods cards={paymentFixtures.listCards} onMakePrimary={onMakePrimary} />));
    expect(screen.getByText("Mastercard ending 8211")).toBeTruthy();
    expect(screen.getByText("Exp 11/26")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Make primary: card ending 8211" }));
    await waitFor(() => expect(onMakePrimary).toHaveBeenCalledWith("pm_2"));
    expect(screen.getByRole("button", { name: "Make primary: card ending 4242" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add new card" })).toBeNull();
  });
});

describe("ProductCards", () => {
  it("prices with the old price struck, adds to bag and wishlists", async () => {
    const onAddToBag = vi.fn(async () => {});
    const onWishlist = vi.fn(async () => {});
    render(en(<ProductCards onAddToBag={onAddToBag} onWishlist={onWishlist} products={productFixtures.products} total={24} />));
    const tee = screen.getByRole("link", { name: "Type specimen tee" }).closest("li") as HTMLElement;
    expect(within(tee).getByText("$48").closest("del")).toBeTruthy();
    expect(within(tee).getByText("Rated 4.6 out of 5 from 312 reviews")).toBeTruthy();
    fireEvent.click(within(tee).getByRole("button", { name: "Add to bag" }));
    await waitFor(() => expect(onAddToBag).toHaveBeenCalledWith("orbit-tee"));
    expect(await within(tee).findByRole("button", { name: "Added" })).toBeTruthy();
    fireEvent.click(within(tee).getByRole("button", { name: "Save Type specimen tee to wishlist" }));
    await waitFor(() => expect(onWishlist).toHaveBeenCalledWith({ productId: "orbit-tee", saved: false }));
  });
});

describe("TaskBoard", () => {
  it("summarises the sprint, names counts and links tasks", () => {
    const board = taskFixtures.getBoard;
    render(en(<TaskBoard columns={board.columns} endsOn={board.endsOn} inFlightColumns={["doing"]} startsOn={board.startsOn} taskHref={(t) => `/t/${t.key}`} title={board.name} />));
    expect(screen.getByText("Apr 22 – May 5 · 3 issues, 2 in flight")).toBeTruthy();
    expect(screen.getByText("6 comments")).toBeTruthy();
    expect(screen.getByText("4 / 7 subtasks")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Audit log retention policy" }).getAttribute("href")).toBe("/t/ENG-198");
    expect(screen.getByRole("region", { name: "Review" })).toBeTruthy();
  });
});
