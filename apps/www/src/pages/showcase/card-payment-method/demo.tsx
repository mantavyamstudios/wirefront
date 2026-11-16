// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the cards with sample data. Not shipped by the registry.
import * as fixtures from "./fixtures";
import { PaymentMethods } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function CardPaymentMethodShowcasePage() {
  return <PaymentMethods cards={fixtures.listCards} onAddCard={() => {}} onMakePrimary={() => wait(500)} processor="your payment processor" />;
}
