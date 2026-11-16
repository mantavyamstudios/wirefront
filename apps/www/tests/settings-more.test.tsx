// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the Phase 7 settings screens.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fail } from "@wirefront/ui/wirefront/types";
import * as integrations from "@/pages/showcase/settings-integrations/fixtures";
import { IntegrationDirectory } from "@/pages/showcase/settings-integrations/view";
import * as profile from "@/pages/showcase/settings-profile/fixtures";
import { AccountProfileSettings } from "@/pages/showcase/settings-profile/view";

afterEach(cleanup);

describe("AccountProfileSettings", () => {
  const renderIt = (props: Partial<Parameters<typeof AccountProfileSettings>[0]> = {}) =>
    render(<AccountProfileSettings languages={profile.languages} onSave={async () => {}} profile={profile.getAccountProfile} timeZones={profile.timeZones} {...props} />);

  it("hides what isn't wired", () => {
    renderIt();
    expect(screen.queryByRole("button", { name: "Upload" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Security" })).toBeNull();
    expect(screen.getByRole("button", { name: "Save changes" }).hasAttribute("disabled")).toBe(true);
  });

  it("saves edited fields, validates the handle and shows a server clash", async () => {
    const onSave = vi.fn(async () => fail("That handle is taken.", { handle: "Taken." }));
    renderIt({ onSave });
    fireEvent.change(screen.getByLabelText("Handle"), { target: { value: "Bad Handle" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Use 2–24 lowercase letters, numbers or underscores.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Handle"), { target: { value: "ada" } });
    fireEvent.change(screen.getByLabelText("Time zone"), { target: { value: "Asia/Tokyo" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ displayName: "Mantavyam", handle: "ada", pronouns: "", bio: "", language: "en", timeZone: "Asia/Tokyo" }),
    );
    expect(await screen.findByText("Taken.")).toBeTruthy();
  });

  it("discards edits", () => {
    renderIt();
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Ada" } });
    expect(screen.getByText("Unsaved changes")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe("Mantavyam");
    expect(screen.getByText("All saved")).toBeTruthy();
  });

  it("uploads a photo and links the security pages", async () => {
    const onUploadPhoto = vi.fn(async () => {});
    renderIt({ onUploadPhoto, twoFactor: { description: "On", href: "/2fa" }, deleteAccountHref: "/delete" });
    const file = new File(["x"], "me.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Choose a photo"), { target: { files: [file] } });
    await waitFor(() => expect(onUploadPhoto).toHaveBeenCalledWith(file));
    expect(screen.getByRole("link", { name: "Manage, Two-factor authentication" }).getAttribute("href")).toBe("/2fa");
    expect(screen.getByRole("link", { name: "Delete, Delete account" }).getAttribute("href")).toBe("/delete");
  });
});

describe("IntegrationDirectory", () => {
  it("filters by category and search, and connects through the app", async () => {
    const onConnect = vi.fn(async () => {});
    render(<IntegrationDirectory integrations={integrations.listIntegrations} onConnect={onConnect} />);
    expect(screen.getByText("3 connected · 6 more available")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Configure GitHub" }).getAttribute("href")).toBe("#configure-github");
    fireEvent.click(screen.getByRole("radio", { name: "Observability" }));
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Datadog", "Sentry"]);
    fireEvent.click(screen.getByRole("button", { name: "Connect Sentry" }));
    await waitFor(() => expect(onConnect).toHaveBeenCalledWith("sentry"));
    fireEvent.click(screen.getByRole("radio", { name: "All" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Find an integration" }), { target: { value: "zzz" } });
    expect(screen.getByText("Nothing matches “zzz”.")).toBeTruthy();
  });

  it("hides connect buttons that aren't wired", () => {
    render(<IntegrationDirectory integrations={integrations.listIntegrations} />);
    expect(screen.queryByRole("button", { name: /^Connect/ })).toBeNull();
  });
});
