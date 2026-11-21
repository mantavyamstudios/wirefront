// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail, ok } from "@wirefront/ui/wirefront/types";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as checkoutFx from "@/pages/showcase/commerce-checkout/fixtures";
import { Checkout } from "@/pages/showcase/commerce-checkout/view";
import * as trackerFx from "@/pages/showcase/commerce-delivery-tracker/fixtures";
import { DeliveryTracker } from "@/pages/showcase/commerce-delivery-tracker/view";

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

const props = { countries: checkoutFx.countries, items: checkoutFx.getCart, shippingOptions: checkoutFx.listShippingOptions, storeName: checkoutFx.storeName, taxRate: checkoutFx.taxRate };
const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("commerce", () => {
  it("Checkout validates each step and places the order with the entered details", async () => {
    const onPlaceOrder = vi.fn(async () => ok(checkoutFx.placeOrder));
    render(<Checkout {...props} onPlaceOrder={onPlaceOrder} testCard={checkoutFx.testCard} />, { wrapper: wrap(checkoutFx.now) });
    fireEvent.click(screen.getByRole("button", { name: "Continue to shipping" }));
    expect(screen.getByText("Enter your email so we can send the receipt.")).toBeTruthy();
    type("Email", "rowan@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Continue to shipping" }));
    type("First name", "Rowan");
    type("Last name", "Ellery");
    type("Address", "12 Elm St");
    type("City", "Portland");
    type("ZIP code", "123");
    fireEvent.click(screen.getByRole("button", { name: "Continue to delivery" }));
    expect(screen.getByText("Pick a state.")).toBeTruthy();
    expect(screen.getByText("5 digits, like 97205")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit contact" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue to shipping" }));
    expect(screen.getByRole("heading", { level: 3, name: "Shipping address" })).toBeTruthy();
    expect(onPlaceOrder).not.toHaveBeenCalled();
  });

  it("Checkout pays with the test card and shows the order number", async () => {
    const onPlaceOrder = vi.fn(async () => ok(checkoutFx.placeOrder));
    render(<Checkout {...props} countries={checkoutFx.countries.filter((c) => c.code === "GB")} onPlaceOrder={onPlaceOrder} testCard={checkoutFx.testCard} />, { wrapper: wrap(checkoutFx.now) });
    type("Email", "rowan@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Continue to shipping" }));
    type("First name", "Rowan");
    type("Last name", "Ellery");
    type("Address", "1 High St");
    type("City", "London");
    type("Postcode", "SW1A 1AA");
    fireEvent.click(screen.getByRole("button", { name: "Continue to delivery" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
    fireEvent.click(screen.getByRole("button", { name: "Fill test card" }));
    fireEvent.click(screen.getByRole("button", { name: /^Pay / }));
    await waitFor(() => expect(onPlaceOrder).toHaveBeenCalledWith(expect.objectContaining({ email: "rowan@example.com", shippingId: "standard", address: expect.objectContaining({ country: "GB", postcode: "SW1A 1AA" }), card: expect.objectContaining({ number: "4242424242424242", cvc: "123" }) })));
    expect(await screen.findByText("Order HG-48213")).toBeTruthy();
  });

  it("Checkout hides card fields behind a payment slot and checks promo codes", async () => {
    const onApplyPromo = vi.fn(async ({ code }: { code: string }) => (code === "HEARTH10" ? ok(checkoutFx.applyPromo) : fail("That code isn’t valid.")));
    render(<Checkout {...props} onApplyPromo={onApplyPromo} paymentSlot={<div>Provider fields</div>} />, { wrapper: wrap(checkoutFx.now) });
    const code = screen.getAllByRole("textbox", { name: "Discount code" })[0] as HTMLElement;
    fireEvent.change(code, { target: { value: "nope" } });
    fireEvent.submit(code.closest("form") as HTMLFormElement);
    expect((await screen.findAllByText("That code isn’t valid.")).length).toBeGreaterThan(0);
    fireEvent.change(screen.getAllByRole("textbox", { name: "Discount code" })[0] as HTMLElement, { target: { value: "hearth10" } });
    fireEvent.submit((screen.getAllByRole("textbox", { name: "Discount code" })[0] as HTMLElement).closest("form") as HTMLFormElement);
    await waitFor(() => expect(onApplyPromo).toHaveBeenLastCalledWith({ code: "HEARTH10" }));
    expect((await screen.findAllByText("10% off your order")).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /One more/ })).toBeNull();
  });

  it("DeliveryTracker shows the live ETA and saves a note, rolling back on failure", async () => {
    const onUpdateNote = vi.fn(async () => fail("Could not save the note"));
    render(<DeliveryTracker onUpdateNote={onUpdateNote} order={trackerFx.getDeliveryOrder} tracking={trackerFx.getTracking} />, { wrapper: wrap(trackerFx.now) });
    expect(screen.getByText("Arriving by 7:37 PM")).toBeTruthy();
    expect(screen.getByText("13 min")).toBeTruthy();
    expect(screen.getByText("Tomás is heading up Linden Avenue")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit note" }));
    const box = screen.getByRole("textbox", { name: "Note for the courier" });
    fireEvent.change(box, { target: { value: "Ring twice" } });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));
    await waitFor(() => expect(onUpdateNote).toHaveBeenCalledWith({ note: "Ring twice" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("“Leave with the concierge if I’m not in.”")).toBeTruthy();
  });

  it("DeliveryTracker rates and tips once delivered, and chats with the courier", async () => {
    const onRate = vi.fn(async () => {});
    const onTip = vi.fn(async () => {});
    const onSendMessage = vi.fn(async ({ text }: { text: string }) => ok({ ...trackerFx.sendCourierMessage, text }));
    const delivered = { ...trackerFx.getTracking, status: "delivered" as const, progress: 1 };
    const { rerender } = render(<DeliveryTracker messages={trackerFx.listCourierMessages} onRate={onRate} onSendMessage={onSendMessage} onTip={onTip} order={trackerFx.getDeliveryOrder} quickReplies={trackerFx.quickReplies} tipOptions={trackerFx.tipOptions} tracking={trackerFx.getTracking} />, { wrapper: wrap(trackerFx.now) });
    fireEvent.click(screen.getByRole("button", { name: "Message Tomás" }));
    fireEvent.click(await screen.findByRole("button", { name: "Please ring the bell" }));
    await waitFor(() => expect(onSendMessage).toHaveBeenCalledWith({ text: "Please ring the bell" }));
    expect(await screen.findByText("Please ring the bell", { selector: "span" })).toBeTruthy();
    rerender(<DeliveryTracker messages={trackerFx.listCourierMessages} onRate={onRate} onSendMessage={onSendMessage} onTip={onTip} order={trackerFx.getDeliveryOrder} quickReplies={trackerFx.quickReplies} tipOptions={trackerFx.tipOptions} tracking={delivered} />);
    expect(await screen.findByText("Enjoy your order")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "5 stars" }));
    await waitFor(() => expect(onRate).toHaveBeenCalledWith({ rating: 5 }));
    fireEvent.click(screen.getByRole("button", { name: "$3" }));
    await waitFor(() => expect(onTip).toHaveBeenCalledWith({ amount: 3 }));
    expect(await screen.findByText("Thanks. All $3.00 goes to Tomás.")).toBeTruthy();
  });
});
