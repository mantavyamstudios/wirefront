// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire WebhookSettings to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { WebhookSettings } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

export function SettingsWebhooksShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider now={demoNow} timeZone="UTC">
      <WebhookSettings
        data={state === "loading" || state === "error" ? undefined : state === "empty" ? { ...fixtures.getWebhooks, endpoints: [], deliveries: [] } : fixtures.getWebhooks}
        deliveriesHref="#deliveries"
        docsHref="#docs"
        error="Webhooks didn’t load. Check your connection and try again."
        onAddEndpoint={() => {}}
        onDeleteEndpoint={() => wait(400)}
        onEditEndpoint={() => {}}
        onResend={() => wait(600)}
        onRetry={() => {}}
        onRevealSecret={async () => {
          await wait(300);
          return ok(fixtures.revealSecret);
        }}
        onRotateSecret={async () => {
          await wait(600);
          return ok(fixtures.rotateSecret);
        }}
        onSetPaused={() => wait(400)}
        signatureHeader="Acme-Signature"
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      />
    </WirefrontProvider>
  );
}
