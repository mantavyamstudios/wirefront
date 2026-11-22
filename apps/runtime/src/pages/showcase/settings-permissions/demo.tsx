// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire RolePermissions to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { RolePermissions } from "./view";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function SettingsPermissionsShowcasePage() {
  const state = useShowcaseState();
  return (
    <RolePermissions
      createRoleHref="#new-role"
      data={
        state === "loading" || state === "error"
          ? undefined
          : state === "empty"
            ? { ...fixtures.getPermissions, groups: [] }
            : fixtures.getPermissions
      }
      error="Permissions didn’t load. Check your connection and try again."
      onRetry={() => {}}
      onSetGrant={() => wait(400)}
      status={
        state === "loading" ? "loading" : state === "error" ? "error" : "ready"
      }
    />
  );
}
