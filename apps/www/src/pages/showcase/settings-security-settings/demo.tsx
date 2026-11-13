// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the screen inside the settings shell with a simulated backend.
// Not shipped by the registry; builders wire SecuritySettings to their own auth server.
import { SettingsShell } from "@wirefront/ui/settings-shell";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail, ok } from "@wirefront/ui/wirefront/types";
import { DevlFrame } from "../_devl-frame";
import { settingsBack, settingsNav, settingsUser } from "../_settings-nav";
import * as fixtures from "./fixtures";
import type { ChangePasswordInput } from "./schema";
import { SecuritySettings } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

async function demoChangePassword({ currentPassword }: ChangePasswordInput) {
  await wait(700);
  if (currentPassword.toLowerCase().includes("wrong")) return fail(undefined, { currentPassword: "That isn’t your current password." });
}

export function SettingsSecuritySettingsShowcasePage() {
  return (
    <WirefrontProvider now={demoNow}>
      <DevlFrame>
        <SettingsShell activeId="security" back={settingsBack} groups={settingsNav} user={settingsUser}>
          <SecuritySettings
            accountEmail={fixtures.accountEmail}
            data={fixtures.getSecurity}
            onAddPasskey={async () => {
              await wait(1600);
              return ok(fixtures.addPasskey);
            }}
            onChangePassword={demoChangePassword}
            onDisableTwoFactor={() => wait(600)}
            onRecoveryCodesSaved={() => wait(300)}
            onRegenerateRecoveryCodes={async () => {
              await wait(600);
              return ok(fixtures.regenerateRecoveryCodes);
            }}
            onRemovePasskey={() => wait(600)}
            onRenamePasskey={() => wait(500)}
            onRevealRecoveryCodes={async () => {
              await wait(400);
              return ok(fixtures.getRecoveryCodes);
            }}
            onSignOutOtherSessions={() => wait(700)}
            onSignOutSession={() => wait(500)}
            product={fixtures.product}
            twoFactorSetupHref="#two-factor-setup"
          />
        </SettingsShell>
      </DevlFrame>
    </WirefrontProvider>
  );
}
