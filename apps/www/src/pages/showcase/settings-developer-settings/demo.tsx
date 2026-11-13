// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the screen inside the settings shell with a simulated backend.
// Not shipped by the registry; builders wire DeveloperSettings to their own backend.
import { SettingsShell } from "@wirefront/ui/settings-shell";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import { DevlFrame } from "../_devl-frame";
import { settingsBack, settingsNav, settingsUser } from "../_settings-nav";
import * as fixtures from "./fixtures";
import type { CreateKeyInput, EndpointInput } from "./schema";
import { DeveloperSettings } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

export function SettingsDeveloperSettingsShowcasePage() {
  return (
    <WirefrontProvider now={demoNow}>
      <DevlFrame>
        <SettingsShell activeId="developer" back={settingsBack} groups={settingsNav} user={settingsUser}>
          <DeveloperSettings
            data={fixtures.getDeveloper}
            onCreateEndpoint={async (input: EndpointInput) => {
              await wait(600);
              return ok({ ...fixtures.createEndpoint, ...input, id: `e_${input.url.length}` });
            }}
            onCreateKey={async (input: CreateKeyInput) => {
              await wait(600);
              return ok({ ...fixtures.createKey, key: { ...fixtures.createKey.key, name: input.name, scopes: input.scopes } });
            }}
            onDeleteEndpoint={() => wait(500)}
            onRetryDeliveries={async ({ deliveryIds }) => {
              await wait(900);
              return ok(deliveryIds.map((id) => ({ ...fixtures.sendTest, id, event: "deployment.failed" })));
            }}
            onRevealSecret={async () => ok(fixtures.getSigningSecret)}
            onRevokeKey={() => wait(500)}
            onRollKey={async () => {
              await wait(600);
              return ok(fixtures.rollKey);
            }}
            onRollSecret={async () => {
              await wait(500);
              return ok(fixtures.rollSigningSecret);
            }}
            onSendTest={async () => {
              await wait(800);
              return ok(fixtures.sendTest);
            }}
            onUpdateEndpoint={() => wait(400)}
            product={fixtures.product}
          />
        </SettingsShell>
      </DevlFrame>
    </WirefrontProvider>
  );
}
