// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire ContactDirectory to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { ContactDirectory } from "./view";

export function ProfileDirectoryShowcasePage() {
  const state = useShowcaseState();
  return (
    <ContactDirectory
      company={fixtures.company}
      error="The directory didn’t load. Check your connection and try again."
      onCall={() => {}}
      onMessage={() => {}}
      onRetry={() => {}}
      onVideoCall={() => {}}
      people={
        state === "loading" || state === "error"
          ? undefined
          : state === "empty"
            ? []
            : fixtures.listContacts
      }
      status={
        state === "loading" ? "loading" : state === "error" ? "error" : "ready"
      }
    />
  );
}
