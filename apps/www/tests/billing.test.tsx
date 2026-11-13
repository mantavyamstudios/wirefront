// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the pricing, usage and billing screens.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import * as usageFixtures from "@/pages/showcase/dashboards-usage/fixtures";
import { UsageDashboard } from "@/pages/showcase/dashboards-usage/view";
import * as pricingFixtures from "@/pages/showcase/pricing-three-tier/fixtures";
import { Pricing } from "@/pages/showcase/pricing-three-tier/view";
import * as billingFixtures from "@/pages/showcase/settings-billing/fixtures";
import { BillingSettings } from "@/pages/showcase/settings-billing/view";

afterEach(cleanup);

describe("Pricing", () => {
  it("formats prices and cadences from raw plan data", () => {
    render(<Pricing onChoosePlan={vi.fn()} plans={pricingFixtures.listPlans} />);
    expect(screen.getByText("$24")).toBeTruthy();
    expect(screen.getByText("/seat/month")).toBeTruthy();
    expect(screen.getByText("Custom")).toBeTruthy();
    expect(screen.getByText("forever")).toBeTruthy();
  });

  it("chooses a plan and marks the current one", async () => {
    const onChoosePlan = vi.fn(async () => {});
    render(<Pricing currentPlanId="starter" onChoosePlan={onChoosePlan} plans={pricingFixtures.listPlans} />);
    expect(screen.getByRole("button", { name: "Current plan" }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Start free trial" }));
    await waitFor(() => expect(onChoosePlan).toHaveBeenCalledWith("pro"));
  });
});

describe("UsageDashboard", () => {
  it("computes the cycle from the provider's clock and warns near a limit", () => {
    render(
      <WirefrontProvider now={() => new Date(usageFixtures.now)}>
        <UsageDashboard usage={usageFixtures.getUsage} />
      </WirefrontProvider>,
    );
    expect(screen.getByRole("progressbar", { name: "Billing cycle elapsed" }).getAttribute("aria-valuenow")).toBe("12");
    expect(screen.getByText("94% used").className).toContain("amber");
    expect(screen.getByText("61% used").className).not.toContain("amber");
    expect(screen.getByText("612K")).toBeTruthy();
    expect(screen.queryByText("View invoice")).toBeNull();
  });
});

describe("BillingSettings", () => {
  it("shows the plan's status and cancels only after confirmation", async () => {
    const onCancelPlan = vi.fn(async () => {});
    render(<BillingSettings billing={billingFixtures.getBilling} onCancelPlan={onCancelPlan} />);
    expect(screen.getByText("Active · renews May 14")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel plan" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("You keep Pro until May 14, 2026. After that the workspace moves to the free plan.")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel plan" }));
    await waitFor(() => expect(onCancelPlan).toHaveBeenCalled());
  });

  it("flags a failed payment and links invoices to their hosted pages", () => {
    const billing = { ...billingFixtures.getBilling, plan: { ...billingFixtures.getBilling.plan, status: "past_due" as const } };
    render(<BillingSettings billing={billing} />);
    expect(screen.getByText("Payment failed · update your card")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open invoice INV-2026-04" }).getAttribute("href")).toBe("https://invoice.example.com/INV-2026-04");
    expect(screen.queryByRole("button", { name: "Cancel plan" })).toBeNull();
    expect(screen.queryByText("Update")).toBeNull();
  });
});
