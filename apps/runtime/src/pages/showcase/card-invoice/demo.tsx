// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the list with sample invoices. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import * as fixtures from "./fixtures";
import { RecentInvoices } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

export function CardInvoiceShowcasePage() {
  return (
    <WirefrontProvider now={demoNow}>
      <RecentInvoices invoiceHref={(inv) => `#${inv.id}`} invoices={fixtures.invoices} onExport={() => wait(800)} periodLabel="April 2026" total={fixtures.listRecentInvoices.total} />
    </WirefrontProvider>
  );
}
