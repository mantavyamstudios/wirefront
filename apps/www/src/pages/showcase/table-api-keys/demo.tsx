// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to an in-memory backend and the previewed state.
// Not shipped by the registry; builders wire ApiKeysTable to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import { useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import type { CreateKeyInput } from "./schema";
import { ApiKeysTable } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const demoNow = () => new Date(fixtures.now);

export function TableApiKeysShowcasePage() {
  const state = useShowcaseState();
  const [keys, setKeys] = useState(fixtures.listKeys);

  const onCreate = async (input: CreateKeyInput) => {
    await wait(700);
    const created = { ...fixtures.createKey, key: { ...fixtures.createKey.key, ...input, id: `key_${keys.length + 1}`, prefix: `sk_${input.env}_9b1e` } };
    setKeys((all) => [created.key, ...all]);
    return ok(created);
  };
  const onRotate = async () => {
    await wait(700);
    return ok(fixtures.rotateKey);
  };
  const onRevoke = async (id: string) => {
    await wait(600);
    setKeys((all) => all.filter((k) => k.id !== id));
  };

  return (
    <WirefrontProvider now={demoNow}>
      <ApiKeysTable
        availableScopes={fixtures.scopes}
        error="The keys service didn’t respond. Check your connection and try again."
        keys={state === "empty" ? [] : keys}
        onCreate={onCreate}
        onRetry={() => {}}
        onRevoke={onRevoke}
        onRotate={onRotate}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      />
    </WirefrontProvider>
  );
}
