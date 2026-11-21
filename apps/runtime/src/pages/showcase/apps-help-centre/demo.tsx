// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: sample articles in devl.dev's frame; feedback goes nowhere and contact returns a
// fixed ticket after a short wait. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { HelpCentre } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function AppsHelpCentreShowcasePage() {
  return (
    <WirefrontProvider locale="en-US" timeZone="UTC">
      <DevlFrame>
        <HelpCentre
          articles={fixtures.listArticles}
          categories={fixtures.listCategories}
          email="you@example.com"
          feedbackReasons={fixtures.feedbackReasons}
          onContact={async () => {
            await wait(400);
            return ok(fixtures.contactSupport);
          }}
          onFeedback={async () => {}}
          popularSearches={fixtures.popularSearches}
          productName="Kite"
          replyTime="4 min"
          status={{ label: "All systems normal", ok: true }}
        />
      </DevlFrame>
    </WirefrontProvider>
  );
}
