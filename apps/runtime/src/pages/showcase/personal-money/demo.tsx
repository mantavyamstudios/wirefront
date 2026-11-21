// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: a sample household budget in devl.dev's frame with a fixed clock. Paying a bill
// takes a moment and comes out of the everyday account. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { Money } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function PersonalMoneyShowcasePage() {
  return (
    <WirefrontProvider currency="USD" locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <Money
          accounts={fixtures.listAccounts}
          bills={fixtures.listBills}
          budgets={fixtures.listBudgets}
          onPayBill={async ({ billId }) => {
            await wait(700);
            const bill = fixtures.listBills.find((b) => b.id === billId);
            return ok({ id: `pay-${billId}`, merchant: bill?.name ?? "", category: bill?.category ?? "home", amount: -(bill?.amount ?? 0), accountId: "everyday", postedAt: fixtures.now });
          }}
          productName={fixtures.productName}
          transactions={fixtures.listTransactions}
          user={fixtures.user}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
