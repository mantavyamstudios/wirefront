// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the settings shell and the settings screens.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsShell } from "@wirefront/ui/settings-shell";
import { fail } from "@wirefront/ui/wirefront/types";
import { ok } from "@wirefront/ui/wirefront/types";
import * as devFixtures from "@/pages/showcase/settings-developer-settings/fixtures";
import { DeveloperSettings } from "@/pages/showcase/settings-developer-settings/view";
import * as profileFixtures from "@/pages/showcase/settings-profile-settings/fixtures";
import { ProfileSettings } from "@/pages/showcase/settings-profile-settings/view";
import * as notifyFixtures from "@/pages/showcase/settings-notification-settings/fixtures";
import * as securityFixtures from "@/pages/showcase/settings-security-settings/fixtures";
import { SecuritySettings } from "@/pages/showcase/settings-security-settings/view";
import * as teamFixtures from "@/pages/showcase/settings-team-roles/fixtures";
import { TeamRoles } from "@/pages/showcase/settings-team-roles/view";
import { NotificationSettings } from "@/pages/showcase/settings-notification-settings/view";

afterEach(cleanup);

describe("SettingsShell", () => {
  it("links each item, marks the current one and renders the page inside", () => {
    render(
      <SettingsShell
        activeId="security"
        back={{ href: "/", label: "Back to Acme" }}
        groups={[{ label: "Account", items: [{ id: "profile", label: "Profile", href: "/settings/profile" }, { id: "security", label: "Security", href: "/settings/security" }] }]}
      >
        <h1>Security page</h1>
      </SettingsShell>,
    );
    expect(screen.getByRole("heading", { name: "Security page" })).toBeTruthy();
    const nav = screen.getAllByRole("navigation", { name: "Settings" })[0] as HTMLElement;
    expect(within(nav).getByRole("link", { name: "Security" }).getAttribute("aria-current")).toBe("page");
    expect(within(nav).getByRole("link", { name: "Profile" }).getAttribute("href")).toBe("/settings/profile");
    expect(screen.getAllByRole("link", { name: "Back to Acme" })[0]?.getAttribute("href")).toBe("/");
  });
});

describe("NotificationSettings", () => {
  const data = notifyFixtures.getNotificationSettings;

  it("saves the whole preference set after each change", async () => {
    const onSave = vi.fn(async (_prefs: typeof data.preferences) => {});
    render(<NotificationSettings data={data} onSave={onSave} product="Acme" />);
    fireEvent.click(screen.getByRole("switch", { name: "Billing notifications" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const saved = onSave.mock.calls[0]?.[0];
    expect(saved?.sections.find((s) => s.id === "billing")?.enabled).toBe(false);
    expect(saved?.channels).toEqual(data.preferences.channels);
    expect(await screen.findByText("Saved")).toBeTruthy();
  });

  it("goes back to the last saved preferences and shows why when a save fails", async () => {
    render(<NotificationSettings data={data} onSave={async () => fail("Couldn't save. Try again.")} product="Acme" />);
    const toggle = screen.getByRole("switch", { name: "Billing notifications" });
    fireEvent.click(toggle);
    expect((await screen.findByRole("alert")).textContent).toBe("Couldn't save. Try again.");
    await waitFor(() => expect(toggle.getAttribute("aria-checked")).toBe("true"));
  });

  it("restores defaults only when something changed", async () => {
    const onSave = vi.fn(async () => {});
    render(<NotificationSettings data={data} onSave={onSave} product="Acme" />);
    const restore = screen.getAllByRole("button", { name: "Restore defaults" })[0] as HTMLElement;
    expect(restore.hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("switch", { name: "Quiet hours" }));
    await waitFor(() => expect(restore.hasAttribute("disabled")).toBe(false));
    fireEvent.click(restore);
    await waitFor(() => expect(onSave).toHaveBeenLastCalledWith(data.defaults));
  });
});

describe("SecuritySettings", () => {
  const base = { accountEmail: "ada@acme.dev", data: securityFixtures.getSecurity, product: "Acme" };

  it("changes the password only with the current one", async () => {
    const onChangePassword = vi.fn(async () => {});
    render(<SecuritySettings {...base} onChangePassword={onChangePassword} />);
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "a much longer secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(await screen.findByText("Enter your current password.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "old secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => expect(onChangePassword).toHaveBeenCalledWith({ currentPassword: "old secret", newPassword: "a much longer secret" }));
    expect(await screen.findByText("Changed just now")).toBeTruthy();
  });

  it("shows recovery codes from the server, and regenerates after confirmation", async () => {
    const onReveal = vi.fn(async () => ok(securityFixtures.getRecoveryCodes));
    const onRegenerate = vi.fn(async () => ok(securityFixtures.regenerateRecoveryCodes));
    render(<SecuritySettings {...base} onChangePassword={vi.fn()} onRegenerateRecoveryCodes={onRegenerate} onRevealRecoveryCodes={onReveal} />);
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(await screen.findByText("x4tn-9pwa")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Regenerate" })[0] as HTMLElement);
    const strip = (await screen.findAllByRole("alert")).find((el) => el.textContent?.includes("Make a new set?")) as HTMLElement;
    fireEvent.click(within(strip).getByRole("button", { name: "Regenerate" }));
    expect(await screen.findByText("f3kd-8mwq")).toBeTruthy();
    expect(screen.queryByText("x4tn-9pwa")).toBeNull();
    expect(screen.getByText("10 of 10 left. Use one if you lose your phone.")).toBeTruthy();
  });

  it("adds a passkey through the builder's WebAuthn action and signs out other sessions", async () => {
    const onAddPasskey = vi.fn(async () => ok(securityFixtures.addPasskey));
    const onSignOutOtherSessions = vi.fn(async () => {});
    render(<SecuritySettings {...base} onAddPasskey={onAddPasskey} onChangePassword={vi.fn()} onSignOutOtherSessions={onSignOutOtherSessions} />);
    fireEvent.click(screen.getByRole("button", { name: "Add passkey" }));
    await waitFor(() => expect(screen.getByLabelText("Passkey name")).toBeTruthy());

    fireEvent.click(screen.getAllByRole("button", { name: "Sign out of all other sessions" })[0] as HTMLElement);
    const strip = (await screen.findAllByRole("alert")).find((el) => el.textContent?.includes("other sessions?")) as HTMLElement;
    fireEvent.click(within(strip).getByRole("button", { name: "Sign out 3" }));
    expect(await screen.findByText("You’re only signed in on this device.")).toBeTruthy();
  });

  it("hides what isn't wired", () => {
    render(<SecuritySettings {...base} onChangePassword={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Add passkey" })).toBeNull();
    expect(screen.queryByRole("button", { name: "View" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Disable" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Sign out Ridgeline/ })).toBeNull();
  });
});

describe("TeamRoles", () => {
  const base = { data: teamFixtures.getTeam, product: "Acme" };

  it("validates and sends an invite, refusing people already here", async () => {
    const onInvite = vi.fn(async () => ok(teamFixtures.invite));
    render(<TeamRoles {...base} onInvite={onInvite} />);
    const email = screen.getByLabelText("Email address");
    fireEvent.change(email, { target: { value: "theo@ridgeline.app" } });
    fireEvent.click(screen.getByRole("button", { name: "Invite" }));
    expect(await screen.findByText("That person is already here or invited.")).toBeTruthy();
    fireEvent.change(email, { target: { value: "sam@ridgeline.app" } });
    fireEvent.click(screen.getByRole("button", { name: "Invite" }));
    await waitFor(() => expect(onInvite).toHaveBeenCalledWith({ email: "sam@ridgeline.app", roleId: "member" }));
    expect(await screen.findByText("Invite sent to sam@ridgeline.app")).toBeTruthy();
  });

  it("edits roles as a draft and saves the whole set from the bar", async () => {
    const onSaveRoles = vi.fn(async (_roles: unknown) => {});
    render(<TeamRoles {...base} onSaveRoles={onSaveRoles} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Viewer: Delete projects" }));
    expect(await screen.findByText("You have unsaved changes")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSaveRoles).toHaveBeenCalled());
    const saved = onSaveRoles.mock.calls[0]?.[0] as { id: string; grants: string[] }[];
    expect(saved.find((r) => r.id === "viewer")?.grants).toContain("projects.delete");
    expect(saved.some((r) => r.id === "owner")).toBe(false);
    expect(await screen.findByText("Roles saved")).toBeTruthy();
  });

  it("is read-only where the builder hasn't wired changes", () => {
    render(<TeamRoles {...base} />);
    expect(screen.queryByLabelText("Email address")).toBeNull();
    expect(screen.queryByRole("button", { name: /Duplicate/ })).toBeNull();
    expect(screen.getByRole("checkbox", { name: "Viewer: Delete projects" }).getAttribute("aria-disabled") ?? screen.getByRole("checkbox", { name: "Viewer: Delete projects" }).hasAttribute("data-disabled")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "Role for Theo Marsh" })).toBeNull();
  });
});

describe("DeveloperSettings", () => {
  const base = { data: devFixtures.getDeveloper, product: "Acme" };

  it("creates a key with scopes and expiry and shows its secret once", async () => {
    const onCreateKey = vi.fn(async () => ok(devFixtures.createKey));
    render(<DeveloperSettings {...base} onCreateKey={onCreateKey} />);
    fireEvent.click(screen.getByRole("button", { name: "Create key" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "Release pipeline" } });
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Domains: write" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Create key" }));
    expect(await screen.findByText(devFixtures.createKey.secret)).toBeTruthy();
    expect(onCreateKey).toHaveBeenCalledWith({
      name: "Release pipeline",
      scopes: ["write:domains", "read:projects", "read:deployments", "read:domains"],
      expiresInDays: 90,
    });
  });

  it("fetches the signing secret only when revealed", async () => {
    const onRevealSecret = vi.fn(async () => ok(devFixtures.getSigningSecret));
    render(<DeveloperSettings {...base} onRevealSecret={onRevealSecret} />);
    expect(screen.queryByText(devFixtures.getSigningSecret.secret)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reveal secret" }));
    expect(await screen.findByText(devFixtures.getSigningSecret.secret)).toBeTruthy();
    expect(onRevealSecret).toHaveBeenCalledWith("e1");
  });

  it("retries failed deliveries and shows the server's results", async () => {
    const onRetryDeliveries = vi.fn(async ({ deliveryIds }: { endpointId: string; deliveryIds: string[] }) =>
      ok(deliveryIds.map((id) => ({ ...devFixtures.sendTest, id, event: "deployment.failed" }))),
    );
    render(<DeveloperSettings {...base} onRetryDeliveries={onRetryDeliveries} />);
    fireEvent.click(screen.getByRole("button", { name: "Retry failed" }));
    await waitFor(() => expect(onRetryDeliveries).toHaveBeenCalledWith({ endpointId: "e1", deliveryIds: ["d1", "d2"] }));
    await waitFor(() => expect(screen.queryByText("503")).toBeNull());
  });

  it("validates a new endpoint's URL", async () => {
    const onCreateEndpoint = vi.fn(async () => ok(devFixtures.createEndpoint));
    render(<DeveloperSettings {...base} onCreateEndpoint={onCreateEndpoint} />);
    fireEvent.click(screen.getByRole("button", { name: "Add endpoint" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Endpoint URL"), { target: { value: "http://insecure.example.com/hook" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add endpoint" }));
    expect(await within(dialog).findByText("Use a full https:// address.")).toBeTruthy();
    expect(onCreateEndpoint).not.toHaveBeenCalled();
  });
});

describe("ProfileSettings", () => {
  const base = {
    domain: "acme.app",
    product: "Acme",
    profile: profileFixtures.getProfile,
    timeZones: profileFixtures.timeZones,
  };

  it("checks a new username with the builder and offers its suggestions", async () => {
    const checkUsername = vi.fn(async () => ({ available: false, suggestions: ["ada-hq"] }));
    render(<ProfileSettings {...base} checkUsername={checkUsername} onSave={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "ada" } });
    expect(await screen.findByRole("button", { name: "ada-hq" }, { timeout: 2000 })).toBeTruthy();
    expect(checkUsername).toHaveBeenCalledWith("ada");
    expect(screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(true);
  });

  it("saves the edited profile from the bar", async () => {
    const onSave = vi.fn(async (_p: typeof profileFixtures.getProfile) => {});
    render(<ProfileSettings {...base} checkUsername={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Public name"), { target: { value: "Ada L." } });
    fireEvent.click(await screen.findByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ ...profileFixtures.getProfile, publicName: "Ada L." }));
    expect(await screen.findByText("Profile saved")).toBeTruthy();
  });

  it("keeps the edits and shows why when saving fails", async () => {
    render(<ProfileSettings {...base} checkUsername={vi.fn()} onSave={async () => fail("That username was just taken.")} />);
    fireEvent.change(screen.getByLabelText("Public name"), { target: { value: "Ada L." } });
    fireEvent.click(await screen.findByRole("button", { name: "Save" }));
    expect((await screen.findByRole("alert")).textContent).toBe("That username was just taken.");
    expect((screen.getByLabelText("Public name") as HTMLInputElement).value).toBe("Ada L.");
  });
});
