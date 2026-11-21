// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: a sample cart in devl.dev's frame with a fixed clock. HEARTH10 is the only valid
// code, and paying takes a moment and never charges anything. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail, ok } from "@wirefront/ui/wirefront/types";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { Checkout } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function CommerceCheckoutShowcasePage() {
  return (
    <WirefrontProvider currency="USD" locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <Checkout
          countries={fixtures.countries}
          items={fixtures.getCart}
          onApplyPromo={async ({ code }) => {
            await wait(300);
            return code === fixtures.applyPromo.code ? ok(fixtures.applyPromo) : fail("That code isn’t valid. Check for typos.");
          }}
          onPlaceOrder={async () => {
            await wait(1400);
            return ok(fixtures.placeOrder);
          }}
          onTrackOrder={() => {}}
          onUpdateQuantity={async () => {}}
          shippingOptions={fixtures.listShippingOptions}
          storeName={fixtures.storeName}
          taxRate={fixtures.taxRate}
          testCard={fixtures.testCard}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
