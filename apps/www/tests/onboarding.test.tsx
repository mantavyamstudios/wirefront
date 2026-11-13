// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the onboarding screens.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ok } from "@wirefront/ui/wirefront/types";
import { InviteTeammates } from "@/pages/showcase/forms-invite-teammates/view";

afterEach(cleanup);

describe("InviteTeammates", () => {
  const typeEmails = (text: string) => {
    const input = screen.getByLabelText("Invitee emails");
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: "Enter" });
  };

  it("sends valid addresses outside the auto-join domain, with their roles and the note", async () => {
    const onSend = vi.fn(async () => ok({ sent: 1 }));
    render(<InviteTeammates autoJoinDomain="acme.com" defaultMessage="Welcome!" onSend={onSend} />);
    typeEmails("alex@globex.com, priya@acme.com, not-an-email");
    expect(screen.getByText("1 to invite")).toBeTruthy();
    expect(screen.getByText("1 auto-join")).toBeTruthy();
    expect(screen.getByText("1 invalid")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "+ Add a personal note" }));
    fireEvent.click(screen.getByRole("button", { name: /Send 1 invite/ }));
    await waitFor(() => expect(onSend).toHaveBeenCalledWith({ invitations: [{ email: "alex@globex.com", role: "member" }], message: "Welcome!" }));
    expect(await screen.findByText("Sent 1 invitations.")).toBeTruthy();
    expect(screen.queryByText("alex@globex.com")).toBeNull();
  });

  it("ignores duplicates, uses the default role, and shows a failure", async () => {
    const onSend = vi.fn(async () => {
      throw new Error("Invitations are paused for this workspace.");
    });
    render(<InviteTeammates onSend={onSend} />);
    typeEmails("ada@x.dev ada@x.dev");
    expect(screen.getAllByText("ada@x.dev")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Send 1 invite/ }));
    expect((await screen.findByRole("alert")).textContent).toBe("Invitations are paused for this workspace.");
    expect(screen.queryByText(/auto-join/i)).toBeNull();
    expect(screen.queryByText("Copy link")).toBeNull();
  });
});
