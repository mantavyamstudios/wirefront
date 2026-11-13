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
import * as notifyFixtures from "@/pages/showcase/settings-notification-settings/fixtures";
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
    const onSave = vi.fn(async () => {});
    render(<NotificationSettings data={data} onSave={onSave} product="Acme" />);
    fireEvent.click(screen.getByRole("switch", { name: "Billing notifications" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const saved = onSave.mock.calls[0]?.[0] as typeof data.preferences;
    expect(saved.sections.find((s) => s.id === "billing")?.enabled).toBe(false);
    expect(saved.channels).toEqual(data.preferences.channels);
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
