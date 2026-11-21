// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the form screens.
 */
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { fail, ok } from "@wirefront/ui/wirefront/types";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as apiKeyFixtures from "@/pages/showcase/forms-api-key/fixtures";
import { CreateApiKey } from "@/pages/showcase/forms-api-key/view";
import * as notificationFixtures from "@/pages/showcase/forms-notifications/fixtures";
import { NotificationSettings } from "@/pages/showcase/forms-notifications/view";
import * as workspaceFixtures from "@/pages/showcase/forms-workspace-settings/fixtures";
import { WorkspaceSettings } from "@/pages/showcase/forms-workspace-settings/view";

afterEach(cleanup);

const switchFor = (name: string) => screen.getByRole("switch", { name });

describe("NotificationSettings", () => {
  const renderIt = (onChange: (change: unknown) => Promise<unknown>) =>
    render(
      <WirefrontProvider locale="en-US">
        <NotificationSettings
          defaultPreferences={notificationFixtures.getPreferences}
          onChange={onChange as never}
          quietHours={notificationFixtures.quietHours}
          sections={notificationFixtures.sections}
        />
      </WirefrontProvider>,
    );

  it("saves one switch at a time and formats quiet hours for the locale", async () => {
    const onChange = vi.fn(async () => {});
    renderIt(onChange);
    expect(switchFor("Weekly digest — Push").getAttribute("aria-checked")).toBe("false");
    fireEvent.click(switchFor("Weekly digest — Push"));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ key: "weekly", channel: "push", enabled: true }));
    expect(switchFor("Weekly digest — Push").getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText(/between 10:00 PM and 8:00 AM/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });

  it("toggles from anywhere in the switch's cell", async () => {
    const onChange = vi.fn(async () => {});
    renderIt(onChange);
    fireEvent.click(switchFor("Billing receipts — Push").closest("label") as HTMLElement);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ key: "billing", channel: "push", enabled: true }));
  });

  it("flips the switch back and says why when saving fails", async () => {
    let reject: (error: Error) => void = () => {};
    const onChange = vi.fn(() => new Promise((_, r) => (reject = r)));
    renderIt(onChange);
    fireEvent.click(switchFor("Comments and replies — Email"));
    expect(switchFor("Comments and replies — Email").getAttribute("aria-checked")).toBe("false");
    await act(async () => reject(new Error("Couldn’t save that.")));
    expect(switchFor("Comments and replies — Email").getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe("Couldn’t save that.");
  });
});

describe("CreateApiKey", () => {
  it("validates, sends the name, scopes and expiry, then shows the secret once", async () => {
    const onCreate = vi.fn(async () => ok(apiKeyFixtures.createApiKey));
    const onDone = vi.fn();
    render(<CreateApiKey onCreate={onCreate} onDone={onDone} scopeGroups={apiKeyFixtures.scopeGroups} />);
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Generate key" }));
    expect(await screen.findByText("Name the key after where it’s used.")).toBeTruthy();
    expect(screen.getByText("Pick at least one scope.")).toBeTruthy();
    expect(onCreate).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "CI deploy bot" } });
    // The whole scope row is the label; the checkbox is named by the scope alone.
    fireEvent.click(screen.getByText("List and read project metadata."));
    expect(screen.getByRole("checkbox", { name: "read:projects" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.change(screen.getByLabelText("Expires after"), { target: { value: "never" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate key" }));
    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({ name: "CI deploy bot", scopes: ["read:projects"], expiresInDays: null }),
    );
    expect(await screen.findByText(apiKeyFixtures.createApiKey.secret)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onDone).toHaveBeenCalledWith(apiKeyFixtures.createApiKey);
    expect(screen.queryByText(apiKeyFixtures.createApiKey.secret)).toBeNull();
  });

  it("offers the configured expiries and shows a failure", async () => {
    const onCreate = vi.fn(async () => fail("Key limit reached."));
    render(
      <CreateApiKey
        allowNever={false}
        defaultExpiryDays={30}
        defaultScopes={["read:members"]}
        expiryOptions={[30, 730]}
        onCreate={onCreate}
        scopeGroups={apiKeyFixtures.scopeGroups}
      />,
    );
    const options = [...(screen.getByLabelText("Expires after") as HTMLSelectElement).options].map((o) => o.textContent);
    expect(options).toEqual(["30 days", "2 years"]);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Bot" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate key" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Key limit reached.");
    expect(onCreate).toHaveBeenCalledWith({ name: "Bot", scopes: ["read:members"], expiresInDays: 30 });
  });
});

describe("WorkspaceSettings", () => {
  const props = {
    defaultValues: workspaceFixtures.getGeneralSettings,
    timeZones: workspaceFixtures.timeZones,
  };

  it("tracks unsaved changes, discards them and saves the whole form", async () => {
    const onSave = vi.fn(async () => {});
    render(<WorkspaceSettings {...props} onSave={onSave} />);
    const save = screen.getByRole("button", { name: "Save changes" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("button", { name: /Upload avatar/ })).toBeNull();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Acme Labs" } });
    expect(screen.getByRole("status").textContent).toBe("Unsaved changes");
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("Acme inc.");
    expect(screen.getByRole("status").textContent).toBe("All saved");

    fireEvent.click(screen.getByText("Display the short ID next to project names everywhere."));
    expect(switchFor("Show project IDs").getAttribute("aria-checked")).toBe("true");
    fireEvent.change(screen.getByLabelText("Timezone"), { target: { value: "UTC" } });
    fireEvent.click(save);
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ ...workspaceFixtures.getGeneralSettings, showProjectIds: true, timeZone: "UTC" }),
    );
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("All saved"));
  });

  it("puts a server field error on the slug and links the settings nav through the router", async () => {
    const onSave = vi.fn(async () => fail(undefined, { slug: "That slug is taken." }));
    render(<WorkspaceSettings {...props} activeSection="general" nav={workspaceFixtures.nav} onSave={onSave} />);
    expect(screen.getByRole("link", { name: "General" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Billing" }).getAttribute("href")).toBe("#billing");

    fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "Not Valid" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Lowercase letters, numbers and dashes.")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "admin" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("That slug is taken.")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Unsaved changes");
  });

  it("uploads a new avatar", async () => {
    const onUploadAvatar = vi.fn(async () => ok({ avatarUrl: "https://example.com/new.png" }));
    render(<WorkspaceSettings {...props} onSave={async () => {}} onUploadAvatar={onUploadAvatar} />);
    const file = new File(["x"], "logo.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Upload avatar", { selector: "input" }), { target: { files: [file] } });
    await waitFor(() => expect(onUploadAvatar).toHaveBeenCalledWith(file));
    expect((await screen.findByRole("img", { name: "Workspace avatar" })).getAttribute("src")).toBe("https://example.com/new.png");
  });
});
