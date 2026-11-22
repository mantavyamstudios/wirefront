// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the illustrated auth screens (particle layout).
 */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fail } from "@wirefront/ui/wirefront/types";
import { CheckEmail } from "@/pages/showcase/auth-check-email/view";
import { ParticleSignIn } from "@/pages/showcase/login/view";
import { WorkspaceOnboarding } from "@/pages/showcase/onboarding/view";
import { Waitlist } from "@/pages/showcase/waitlist/view";

// The particle field draws on a canvas, which jsdom doesn't implement.
vi.mock("@wirefront/ui/particle-field", () => ({
  ParticleField: () => null,
  bumpParticleTypingImpulse: vi.fn(),
  pulseParticleSubmitImpulse: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const typeIn = (label: string | RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("CheckEmail", () => {
  it("hides unwired links and resends after the cooldown", async () => {
    vi.useFakeTimers();
    const onResend = vi.fn(async () => {});
    render(<CheckEmail email="ada@example.com" illustration="/x.png" />);
    expect(screen.queryByRole("button", { name: /Resend/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /different email/ })).toBeNull();
    expect(screen.getByText("ada@example.com")).toBeTruthy();

    cleanup();
    render(
      <CheckEmail
        changeEmailHref="/sign-in"
        email="ada@example.com"
        expiresInMinutes={10}
        illustration="/x.png"
        onResend={onResend}
        resendAfter={2}
        supportHref="/help"
      />
    );
    expect(screen.getByText(/expires in 10 minutes/)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /Use a different email/ })
        .getAttribute("href")
    ).toBe("/sign-in");
    expect(
      screen.getByRole("link", { name: /contact support/ }).getAttribute("href")
    ).toBe("/help");
    const resend = screen.getByRole("button", { name: "Resend in 02s" });
    expect(resend.hasAttribute("disabled")).toBe(true);
    // One tick per second, each scheduled after the last renders.
    for (const _ of [1, 2]) await act(async () => vi.advanceTimersByTime(1000));
    fireEvent.click(screen.getByRole("button", { name: "Resend link" }));
    await act(async () => {});
    expect(onResend).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status").textContent).toBe("Sent again · 1");
  });

  it("shows why a resend failed", async () => {
    render(
      <CheckEmail
        email="a@b.co"
        illustration="/x.png"
        onResend={async () => fail("Slow down.")}
        resendAfter={0}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Resend link" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Slow down.");
  });
});

describe("ParticleSignIn", () => {
  it("validates, sends the link and reports it", async () => {
    const onMagicLink = vi.fn(async () => {});
    const onSent = vi.fn();
    render(
      <ParticleSignIn
        illustration="/x.png"
        onMagicLink={onMagicLink}
        onSent={onSent}
      />
    );
    expect(screen.queryByRole("button", { name: /Continue with/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Send sign-in link" }));
    expect(
      await screen.findByText("Enter a valid email address.")
    ).toBeTruthy();
    expect(onMagicLink).not.toHaveBeenCalled();
    typeIn("Email", "ada@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Send sign-in link" }));
    await waitFor(() =>
      expect(onMagicLink).toHaveBeenCalledWith({ email: "ada@example.com" })
    );
    expect((await screen.findByRole("status")).textContent).toBe(
      "Link sent to ada@example.com. Open your inbox to continue."
    );
    expect(onSent).toHaveBeenCalledWith({ email: "ada@example.com" });
  });

  it("starts a provider and shows its failure", async () => {
    const onProvider = vi.fn(async () => {
      throw new Error("Google is unavailable.");
    });
    render(
      <ParticleSignIn
        illustration="/x.png"
        onMagicLink={async () => {}}
        onProvider={onProvider}
        providers={[{ id: "google", name: "Google" }]}
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" })
    );
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Google is unavailable."
    );
    expect(onProvider).toHaveBeenCalledWith("google");
  });
});

describe("WorkspaceOnboarding", () => {
  it("creates the workspace, invites people and links into the app", async () => {
    const onCreateWorkspace = vi.fn(async () => {});
    const onInvite = vi.fn(async () => {});
    render(
      <WorkspaceOnboarding
        enterHref="/app"
        illustration="/x.png"
        onCreateWorkspace={onCreateWorkspace}
        onInvite={onInvite}
        plan="Free"
      />
    );
    expect(screen.getByText("Step 01 / 3")).toBeTruthy();
    typeIn("Workspace name", "  Acme  ");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(onCreateWorkspace).toHaveBeenCalledWith({ name: "Acme" })
    );

    expect(
      await screen.findByRole("heading", { name: "Invite teammates" })
    ).toBeTruthy();
    typeIn("Teammate’s email", "nope");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
    for (const email of [
      "Bo@Example.com",
      "cy@example.com",
      "bo@example.com",
    ]) {
      typeIn("Teammate’s email", email);
      fireEvent.click(screen.getByRole("button", { name: "Add" }));
    }
    fireEvent.click(
      screen.getByRole("button", { name: "Remove, cy@example.com" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Send 1 invite" }));
    await waitFor(() =>
      expect(onInvite).toHaveBeenCalledWith({ emails: ["bo@example.com"] })
    );

    expect(
      await screen.findByRole("heading", { name: "Welcome to Acme." })
    ).toBeTruthy();
    expect(
      screen.getByText("We’ve sent 1 invite. It’ll show up here once accepted.")
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Take me in" }).getAttribute("href")
    ).toBe("/app");
  });

  it("skips the invite step when it isn't wired and shows a name clash", async () => {
    const onCreateWorkspace = vi.fn(async () => fail("That name is taken."));
    render(
      <WorkspaceOnboarding
        enterHref="/app"
        illustration="/x.png"
        onCreateWorkspace={onCreateWorkspace}
      />
    );
    expect(screen.getByText("Step 01 / 2")).toBeTruthy();
    typeIn("Workspace name", "Acme");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "That name is taken."
    );
  });
});

describe("Waitlist", () => {
  it("joins with a valid email and confirms", async () => {
    const onJoin = vi.fn(async () => {});
    render(<Waitlist illustration="/x.png" onJoin={onJoin} />);
    typeIn("Email", "ada@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Join the waitlist" }));
    await waitFor(() =>
      expect(onJoin).toHaveBeenCalledWith({ email: "ada@example.com" })
    );
    expect((await screen.findByRole("status")).textContent).toBe(
      "You’re on the list. We’ll write to ada@example.com."
    );
  });
});
