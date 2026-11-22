// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the pricing screens converted in Phase 7.
 */
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
import { afterEach, describe, expect, it, vi } from "vitest";
import * as comparisonFixtures from "@/pages/showcase/pricing-comparison-table/fixtures";
import { PlanComparison } from "@/pages/showcase/pricing-comparison-table/view";
import * as salesFixtures from "@/pages/showcase/pricing-contact-sales/fixtures";
import { ContactSales } from "@/pages/showcase/pricing-contact-sales/view";
import * as billingFixtures from "@/pages/showcase/pricing-monthly-yearly/fixtures";
import { BillingPeriodPricing } from "@/pages/showcase/pricing-monthly-yearly/view";
import * as singleFixtures from "@/pages/showcase/pricing-simple-card/fixtures";
import { SinglePlanPricing } from "@/pages/showcase/pricing-simple-card/view";
import * as seatFixtures from "@/pages/showcase/pricing-slider-seats/fixtures";
import { SeatPricing } from "@/pages/showcase/pricing-slider-seats/view";

afterEach(cleanup);
const en = (ui: React.ReactNode) => (
  <WirefrontProvider locale="en-US">{ui}</WirefrontProvider>
);

describe("SinglePlanPricing", () => {
  it("prices the plan, starts the trial and hides the contact link when unwired", () => {
    const onStart = vi.fn();
    render(
      en(<SinglePlanPricing onStart={onStart} plan={singleFixtures.getPlan} />)
    );
    expect(screen.getByText("$19")).toBeTruthy();
    expect(screen.getByText("14 days free · no card needed")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Start your trial/ }));
    expect(onStart).toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: "Talk to us" })).toBeNull();
  });
});

describe("SeatPricing", () => {
  it("prices seats per billing period and continues with the selection", () => {
    const onContinue = vi.fn();
    render(
      en(
        <SeatPricing
          defaultSeats={8}
          onContinue={onContinue}
          plan={seatFixtures.getSeatPlan}
        />
      )
    );
    // 8 × $24 × 12 × 0.8 / 12 = $154 a month on yearly billing.
    expect(screen.getByText("$154")).toBeTruthy();
    expect(screen.getByText("$1,843 billed annually · save 20%")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "Monthly" }));
    expect(screen.getByText("$192")).toBeTruthy();
    fireEvent.change(screen.getByRole("slider", { name: "Seats" }), {
      target: { value: "1" },
    });
    expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toBe(
      "1 seat, $24 per month"
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with 1 seat" })
    );
    expect(onContinue).toHaveBeenCalledWith({ seats: 1, billing: "monthly" });
  });
});

describe("BillingPeriodPricing", () => {
  it("works out the saving, shows the struck monthly price and reports the billing chosen", () => {
    const onChoose = vi.fn();
    render(
      en(
        <BillingPeriodPricing
          onChoose={onChoose}
          plans={billingFixtures.listBillingPlans}
        />
      )
    );
    expect(screen.getByText("save 21%")).toBeTruthy();
    expect(screen.getAllByText("billed yearly", { exact: false }).length).toBe(
      2
    );
    fireEvent.click(screen.getByRole("radio", { name: /Monthly/ }));
    expect(screen.getByText("$48")).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Choose plan" })[0] as HTMLElement
    );
    expect(onChoose).toHaveBeenCalledWith(
      billingFixtures.listBillingPlans[1],
      "monthly"
    );
  });
});

describe("ContactSales", () => {
  it("validates, sends the inquiry with the seat range and thanks the user", async () => {
    const onSubmit = vi.fn(async () => {});
    render(
      en(<ContactSales features={salesFixtures.features} onSubmit={onSubmit} />)
    );
    fireEvent.click(screen.getByRole("button", { name: "Request a call" }));
    expect(await screen.findByText("Enter a work email address.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ada" },
    });
    fireEvent.change(screen.getByLabelText("Company"), {
      target: { value: "Acme" },
    });
    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "ada@acme.dev" },
    });
    fireEvent.change(screen.getByLabelText("Estimated seats"), {
      target: { value: "500-1000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request a call" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Ada",
        company: "Acme",
        email: "ada@acme.dev",
        seats: "500-1000",
        message: "",
      })
    );
    expect(await screen.findByText("Thanks — we’ll be in touch.")).toBeTruthy();
  });

  it("shows a failure from the backend", async () => {
    render(
      en(
        <ContactSales
          features={[]}
          onSubmit={async () => fail("Our CRM is down.")}
        />
      )
    );
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ada" },
    });
    fireEvent.change(screen.getByLabelText("Company"), {
      target: { value: "Acme" },
    });
    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "ada@acme.dev" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request a call" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Our CRM is down."
    );
  });
});

describe("PlanComparison", () => {
  it("lays values out by plan id, names included/not included and reports the choice", () => {
    const onChoose = vi.fn();
    render(
      en(
        <PlanComparison
          onChoose={onChoose}
          plans={comparisonFixtures.plans}
          sections={comparisonFixtures.sections}
        />
      )
    );
    const saml = screen
      .getByRole("rowheader", { name: "SAML SSO" })
      .closest("tr") as HTMLElement;
    expect(within(saml).getAllByText("Not included").length).toBe(2);
    expect(within(saml).getAllByText("Included").length).toBe(2);
    expect(
      screen.getByRole("columnheader", { name: /Enterprise/ }).textContent
    ).toContain("Custom");
    expect(
      (screen.getByRole("radio", { name: "Pro" }) as HTMLElement).getAttribute(
        "aria-checked"
      )
    ).toBe("true");
    fireEvent.click(
      screen.getByRole("button", { name: "Talk to us Enterprise" })
    );
    expect(onChoose).toHaveBeenCalledWith(comparisonFixtures.plans[3]);
  });
});
