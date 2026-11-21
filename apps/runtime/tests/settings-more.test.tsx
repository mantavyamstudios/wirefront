// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the Phase 7 settings screens.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail, ok } from "@wirefront/ui/wirefront/types";
import * as integrations from "@/pages/showcase/settings-integrations/fixtures";
import { IntegrationDirectory } from "@/pages/showcase/settings-integrations/view";
import * as security from "@/pages/showcase/settings-security/fixtures";
import { SecurityOverview } from "@/pages/showcase/settings-security/view";
import * as developer from "@/pages/showcase/settings-developer/fixtures";
import { DeveloperLabs } from "@/pages/showcase/settings-developer/view";
import * as permissions from "@/pages/showcase/settings-permissions/fixtures";
import { RolePermissions } from "@/pages/showcase/settings-permissions/view";
import * as privacy from "@/pages/showcase/settings-privacy/fixtures";
import { PrivacyData } from "@/pages/showcase/settings-privacy/view";
import * as appearance from "@/pages/showcase/settings-appearance/fixtures";
import { AppearanceSettings } from "@/pages/showcase/settings-appearance/view";
import * as sso from "@/pages/showcase/settings-sso/fixtures";
import { SsoSetup } from "@/pages/showcase/settings-sso/view";
import * as branding from "@/pages/showcase/settings-branding/fixtures";
import { WorkspaceBranding } from "@/pages/showcase/settings-branding/view";
import * as webhooks from "@/pages/showcase/settings-webhooks/fixtures";
import { WebhookSettings } from "@/pages/showcase/settings-webhooks/view";
import * as localization from "@/pages/showcase/settings-localization/fixtures";
import { LocalizationSettings } from "@/pages/showcase/settings-localization/view";
import * as theme from "@/pages/showcase/settings-appearance-settings/fixtures";
import { ThemeSettings } from "@/pages/showcase/settings-appearance-settings/view";
import * as connectors from "@/pages/showcase/settings-connectors/fixtures";
import { ConnectorMarketplace } from "@/pages/showcase/settings-connectors/view";
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

describe("SecurityOverview", () => {
  const renderIt = (props: Partial<Parameters<typeof SecurityOverview>[0]> = {}) =>
    render(
      <WirefrontProvider locale="en-US" now={() => new Date(security.now)}>
        <SecurityOverview data={security.getSecurity} {...props} />
      </WirefrontProvider>,
    );

  it("shows status from the provider clock and hides unwired actions", () => {
    renderIt();
    expect(screen.getByText("Last verified 2 hours ago")).toBeTruthy();
    expect(screen.getByText("12 minutes ago")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add passkey" })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Revoke/ })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Recovery codes" })).toBeNull();
  });

  it("removes passkeys, revokes sessions and signs out the others through the app", async () => {
    const onRemovePasskey = vi.fn(async () => {});
    const onRevokeSession = vi.fn(async () => fail("That session already ended."));
    const onRevokeOtherSessions = vi.fn(async () => {});
    renderIt({ onRemovePasskey, onRevokeSession, onRevokeOtherSessions });
    fireEvent.click(screen.getByRole("button", { name: "Remove YubiKey 5C" }));
    await waitFor(() => expect(onRemovePasskey).toHaveBeenCalledWith("yubikey"));
    fireEvent.click(screen.getByRole("button", { name: "Revoke session in Berlin, DE" }));
    expect((await screen.findByRole("alert")).textContent).toBe("That session already ended.");
    fireEvent.click(screen.getByRole("button", { name: "Sign out of all other sessions" }));
    await waitFor(() => expect(onRevokeOtherSessions).toHaveBeenCalled());
  });

  it("fetches recovery codes only when revealed, and regenerates them", async () => {
    const onRevealCodes = vi.fn(async () => ok(security.getRecoveryCodes));
    const onRegenerateCodes = vi.fn(async () => ok(security.regenerateRecoveryCodes));
    renderIt({ onRevealCodes, onRegenerateCodes });
    expect(screen.queryByText("4F2A-9XK7-LM3D")).toBeNull();
    expect(onRevealCodes).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Reveal codes" }));
    expect(await screen.findByText("4F2A-9XK7-LM3D")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Regenerate codes" }));
    expect(await screen.findByText("7T2B-QW9M-ZK4D")).toBeTruthy();
    expect(screen.queryByText("4F2A-9XK7-LM3D")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Hide codes" }));
    expect(screen.queryByText("7T2B-QW9M-ZK4D")).toBeNull();
  });
});

describe("DeveloperLabs", () => {
  it("toggles a flag at once and rolls it back when saving fails", async () => {
    let reject: (e: Error) => void = () => {};
    const onSetFlag = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    render(<DeveloperLabs data={developer.getDeveloperSettings} onSetFlag={onSetFlag} />);
    expect(screen.getByText("7 / 13 on")).toBeTruthy();
    const flag = screen.getByRole("switch", { name: /preview-card-hover/ });
    fireEvent.click(flag);
    expect(onSetFlag).toHaveBeenCalledWith({ key: "preview-card-hover", enabled: true });
    expect(screen.getByText("8 / 13 on")).toBeTruthy();
    reject(new Error("Flags are locked."));
    expect((await screen.findByRole("alert")).textContent).toBe("Flags are locked.");
    expect(screen.getByText("7 / 13 on")).toBeTruthy();
  });

  it("shows the console with debug on and locks environments for non-admins", async () => {
    const onSetDebug = vi.fn(async () => {});
    const onSetEnvironment = vi.fn(async () => {});
    const { rerender } = render(<DeveloperLabs data={developer.getDeveloperSettings} logLines={developer.logLines} onSetDebug={onSetDebug} onSetEnvironment={onSetEnvironment} />);
    expect(screen.queryByText("card_declined", { exact: false })).toBeNull();
    fireEvent.click(screen.getByRole("switch", { name: "Debug mode" }));
    await waitFor(() => expect(onSetDebug).toHaveBeenCalledWith(true));
    expect(screen.getByText("8 lines")).toBeTruthy();
    expect(screen.getByText("Admin-only — contact your workspace owner to change.")).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Staging/ }).getAttribute("aria-disabled") ?? (screen.getByRole("radio", { name: /Staging/ }) as HTMLButtonElement).disabled.toString()).toMatch(/true/);
    rerender(<DeveloperLabs data={{ ...developer.getDeveloperSettings, canSwitchEnvironment: true }} onSetEnvironment={onSetEnvironment} />);
    fireEvent.click(screen.getByRole("radio", { name: /Staging/ }));
    await waitFor(() => expect(onSetEnvironment).toHaveBeenCalledWith("staging"));
  });
});

describe("RolePermissions", () => {
  it("is read-only without onSetGrant and filters to differences", () => {
    render(<RolePermissions data={permissions.getPermissions} />);
    expect(screen.queryByRole("switch", { name: /for Admin/ })).toBeNull();
    expect(screen.getByText("Viewing")).toBeTruthy();
    expect(screen.getAllByRole("img", { name: "Allowed" }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("switch", { name: "Show only differences" }));
    expect(screen.queryByRole("rowheader", { name: /View documents/ })).toBeNull();
    fireEvent.change(screen.getByRole("searchbox", { name: "Filter capabilities" }), { target: { value: "zzz" } });
    expect(screen.getByText("No capabilities match “zzz”.")).toBeTruthy();
  });

  it("edits the selected role's grants and rolls back a failure; locked roles stay read-only", async () => {
    let reject: (e: Error) => void = () => {};
    const onSetGrant = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    render(<RolePermissions data={permissions.getPermissions} onSetGrant={onSetGrant} />);
    const share = screen.getByRole("switch", { name: "Share externally for Admin" });
    expect(share.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(share);
    expect(onSetGrant).toHaveBeenCalledWith({ roleId: "admin", capabilityId: "doc.share", allowed: false });
    expect(screen.getByRole("switch", { name: "Share externally for Admin" }).getAttribute("aria-checked")).toBe("false");
    reject(new Error("Only owners can change this role."));
    expect((await screen.findByRole("alert")).textContent).toBe("Only owners can change this role.");
    expect(screen.getByRole("switch", { name: "Share externally for Admin" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getAllByRole("button", { name: /^Owner/ })[0] as HTMLElement);
    expect(screen.queryByRole("switch", { name: /for Owner/ })).toBeNull();
    expect(screen.getByText("Owner can’t be edited")).toBeTruthy();
  });
});

describe("PrivacyData", () => {
  const renderIt = (props: Partial<Parameters<typeof PrivacyData>[0]> = {}) =>
    render(
      <WirefrontProvider locale="en-US" now={() => new Date(privacy.now)} timeZone="UTC">
        <PrivacyData data={privacy.getPrivacy} {...props} />
      </WirefrontProvider>,
    );

  it("hides unwired sections and keeps retention read-only", () => {
    renderIt();
    expect(screen.queryByRole("heading", { name: "Export your data" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Delete this account" })).toBeNull();
    expect(screen.getByText("Messages older than 90 days will be permanently deleted at the end of each month.")).toBeTruthy();
  });

  it("exports the chosen categories and shows progress and the download", async () => {
    const onRequestExport = vi.fn(async () => {});
    const { rerender } = renderIt({ onRequestExport });
    expect(screen.getByText(/^2\sGB$/)).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: /Calendar events/ }));
    fireEvent.click(screen.getByRole("button", { name: "Generate export" }));
    await waitFor(() => expect(onRequestExport).toHaveBeenCalledWith({ categories: ["messages", "files", "comments", "calendar"] }));
    rerender(
      <WirefrontProvider locale="en-US" now={() => new Date(privacy.now)} timeZone="UTC">
        <PrivacyData data={{ ...privacy.getPrivacy, latestExport: { ...privacy.requestExport, progress: 40 } }} onRequestExport={onRequestExport} />
      </WirefrontProvider>,
    );
    expect(screen.getByText("40%")).toBeTruthy();
    rerender(
      <WirefrontProvider locale="en-US" now={() => new Date(privacy.now)} timeZone="UTC">
        <PrivacyData data={{ ...privacy.getPrivacy, latestExport: privacy.readyExport }} onRequestExport={onRequestExport} />
      </WirefrontProvider>,
    );
    expect(screen.getByRole("link", { name: "Download" }).getAttribute("href")).toBe("#download-export");
    expect(screen.getByText("export-2026-04-26.zip · link expires tomorrow")).toBeTruthy();
  });

  it("requests deletion and counts down a pending one from the provider clock", async () => {
    const onRequestDeletion = vi.fn(async () => {});
    const onCancelDeletion = vi.fn(async () => {});
    const { rerender } = renderIt({ onRequestDeletion, onCancelDeletion });
    fireEvent.click(screen.getByRole("button", { name: "Request account deletion" }));
    await waitFor(() => expect(onRequestDeletion).toHaveBeenCalled());
    rerender(
      <WirefrontProvider locale="en-US" now={() => new Date(privacy.now)} timeZone="UTC">
        <PrivacyData data={{ ...privacy.getPrivacy, deletion: privacy.pendingDeletion }} onCancelDeletion={onCancelDeletion} onRequestDeletion={onRequestDeletion} />
      </WirefrontProvider>,
    );
    expect(screen.getByText("23")).toBeTruthy();
    expect(screen.getByText("Pending deletion · requested Apr 19, 2026")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel deletion request" }));
    await waitFor(() => expect(onCancelDeletion).toHaveBeenCalled());
  });
});

describe("AppearanceSettings", () => {
  // The preview follows the OS scheme; jsdom has no matchMedia.
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("is read-only without onSave", () => {
    render(<AppearanceSettings prefs={appearance.getAppearance} />);
    expect(screen.getByRole("radio", { name: /Dark/ }).getAttribute("aria-disabled") ?? String((screen.getByRole("radio", { name: /Dark/ }) as HTMLButtonElement).disabled)).toBe("true");
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();
  });

  it("saves each choice at once, reverts a failure and resets to the defaults", async () => {
    const onSave = vi.fn(async (prefs: typeof appearance.getAppearance) => (prefs.font === "mono" ? fail("Couldn’t save.") : undefined));
    render(<AppearanceSettings defaults={appearance.getAppearance} onSave={onSave} prefs={appearance.getAppearance} />);
    fireEvent.click(screen.getByRole("radio", { name: /Dark/ }));
    expect(onSave).toHaveBeenLastCalledWith({ ...appearance.getAppearance, mode: "dark" });
    await waitFor(() => expect(screen.getByRole("radio", { name: /Dark/ }).getAttribute("aria-checked")).toBe("true"));
    fireEvent.click(screen.getByRole("radio", { name: /Geist Mono/ }));
    expect((await screen.findByRole("alert")).textContent).toBe("Couldn’t save.");
    expect(screen.getByRole("radio", { name: /Geist Mono/ }).getAttribute("aria-checked")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(onSave).toHaveBeenLastCalledWith(appearance.getAppearance));
  });
});

describe("SsoSetup", () => {
  const renderIt = (props: Partial<Parameters<typeof SsoSetup>[0]> = {}) =>
    render(<SsoSetup config={sso.getSsoConfig} product="Acme" providers={sso.listSsoProviders} {...props} />);

  it("resumes at the provider's saved step and copies endpoints", async () => {
    const writeText = vi.fn(async () => {});
    Object.assign(navigator, { clipboard: { writeText } });
    renderIt();
    expect(screen.getByRole("heading", { name: "Attribute mapping" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Step 1, done/ }));
    fireEvent.click(screen.getByRole("button", { name: "Copy SSO URL (ACS)" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(sso.getSsoConfig.acsUrl));
    expect(await screen.findByRole("button", { name: "Copied SSO URL (ACS)" })).toBeTruthy();
  });

  it("validates new mappings, saves them, tests and enforces", async () => {
    const onSaveMappings = vi.fn(async () => {});
    const onTest = vi.fn(async () => ok(sso.testSso));
    const onEnforce = vi.fn(async () => {});
    renderIt({ onSaveMappings, onTest, onEnforce });
    fireEvent.click(screen.getByRole("button", { name: "Add mapping" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Enter the attribute name.");
    fireEvent.change(screen.getByRole("textbox", { name: "Attribute name" }), { target: { value: "department" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(onSaveMappings).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ source: "department", target: "ignore" })])));
    fireEvent.click(await screen.findByRole("button", { name: "Run test login" }));
    expect(await screen.findByText(/Mapped 4 of 4 fields\./)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const enforce = screen.getByRole("button", { name: "Save & enforce" });
    expect((enforce as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("switch", { name: /Require SSO for all members/ }));
    fireEvent.click(enforce);
    await waitFor(() => expect(onEnforce).toHaveBeenCalled());
  });
});

describe("WorkspaceBranding", () => {
  it("is read-only without actions", () => {
    render(<WorkspaceBranding data={branding.getBranding} />);
    expect(screen.queryByRole("button", { name: /Upload/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Save colours" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Save domain" })).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Pending DNS");
  });

  it("saves a valid palette, validates the domain and verifies DNS", async () => {
    const onSaveColors = vi.fn(async () => {});
    const onSaveDomain = vi.fn(async () => {});
    const onVerifyDomain = vi.fn(async () => ok(branding.verifyDomain));
    render(<WorkspaceBranding data={branding.getBranding} defaultColors={branding.defaultColors} onSaveColors={onSaveColors} onSaveDomain={onSaveDomain} onVerifyDomain={onVerifyDomain} presets={branding.presets} />);
    const save = screen.getByRole("button", { name: "Save colours" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /^Edit Accent/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Use #ec4899" }));
    fireEvent.click(screen.getByRole("button", { name: "Save colours" }));
    await waitFor(() => expect(onSaveColors).toHaveBeenCalledWith({ ...branding.defaultColors, accent: "#ec4899" }));
    fireEvent.change(screen.getByLabelText("Domain"), { target: { value: "not a domain" } });
    fireEvent.click(screen.getByRole("button", { name: "Save domain" }));
    expect(await screen.findByText("Enter a domain like workspace.yourcompany.com.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Check DNS" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Verified"));
  });

  it("saves the email sender and keeps the inbox preview in step", async () => {
    const onSaveEmail = vi.fn(async () => {});
    render(<WorkspaceBranding data={branding.getBranding} onSaveEmail={onSaveEmail} />);
    fireEvent.change(screen.getByLabelText("From name"), { target: { value: "Acme Team" } });
    fireEvent.click(screen.getByRole("button", { name: "Save sender" }));
    await waitFor(() => expect(onSaveEmail).toHaveBeenCalledWith({ fromName: "Acme Team", replyTo: "noreply@acme.io" }));
    expect(screen.getByText("Welcome to Acme Team — your account is ready.")).toBeTruthy();
  });
});

describe("WebhookSettings", () => {
  const renderIt = (props: Partial<Parameters<typeof WebhookSettings>[0]> = {}) =>
    render(
      <WirefrontProvider locale="en-US" now={() => new Date(webhooks.now)} timeZone="UTC">
        <WebhookSettings data={webhooks.getWebhooks} signatureHeader="Acme-Signature" {...props} />
      </WirefrontProvider>,
    );

  it("masks the secret and hides unwired actions", () => {
    renderIt();
    expect(screen.getByText("whsec_••••••••••••2f3a")).toBeTruthy();
    expect(screen.getByText("Acme-Signature")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reveal signing secret" })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Actions for/ })).toBeNull();
    expect(screen.getByText("2 minutes ago")).toBeTruthy();
  });

  it("reveals and copies the secret only on request", async () => {
    const writeText = vi.fn(async () => {});
    Object.assign(navigator, { clipboard: { writeText } });
    const onRevealSecret = vi.fn(async () => ok(webhooks.revealSecret));
    renderIt({ onRevealSecret });
    fireEvent.click(screen.getByRole("button", { name: "Copy signing secret" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(webhooks.revealSecret.secret));
    expect(onRevealSecret).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Reveal signing secret" }));
    expect(screen.getByText(webhooks.revealSecret.secret)).toBeTruthy();
    expect(onRevealSecret).toHaveBeenCalledTimes(1);
  });

  it("filters failed deliveries, shows payloads and resends", async () => {
    const onResend = vi.fn(async () => {});
    renderIt({ onResend });
    fireEvent.click(screen.getByRole("radio", { name: "Failed" }));
    const rows = screen.getAllByRole("button", { expanded: false });
    expect(rows.every((r) => !/\b(200|204)\b/.test(r.textContent ?? ""))).toBe(true);
    fireEvent.click(rows[0] as HTMLElement);
    expect(screen.getByText("2 of 3")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Resend" }));
    await waitFor(() => expect(onResend).toHaveBeenCalled());
  });
});

describe("LocalizationSettings", () => {
  const renderIt = (props: Partial<Parameters<typeof LocalizationSettings>[0]> = {}) =>
    render(
      <WirefrontProvider locale="en-US" now={() => new Date(localization.now)}>
        <LocalizationSettings currencies={localization.currencies} languages={localization.languages} prefs={localization.getLocalePrefs} timeZones={localization.timeZones} {...props} />
      </WirefrontProvider>,
    );

  it("previews formats from the saved preferences and the provider clock", () => {
    renderIt();
    expect(screen.getAllByText("04/14/2026").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2:30 AM").length).toBeGreaterThan(0);
    expect(screen.getByText("1,234,567.89")).toBeTruthy();
    expect(screen.getByText("Week starts Sunday")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Monday" }).getAttribute("aria-disabled") ?? String((screen.getByRole("radio", { name: "Monday" }) as HTMLButtonElement).disabled)).toBe("true");
  });

  it("saves each change and reformats the preview", async () => {
    const onSave = vi.fn(async () => {});
    renderIt({ onSave });
    fireEvent.click(screen.getByRole("radio", { name: "Monday" }));
    expect(onSave).toHaveBeenLastCalledWith({ ...localization.getLocalePrefs, firstDay: "mon" });
    await waitFor(() => expect(screen.getByText("Week starts Monday")).toBeTruthy());
    fireEvent.click(screen.getByRole("radio", { name: /24-hour/ }));
    await waitFor(() => expect(onSave).toHaveBeenLastCalledWith({ ...localization.getLocalePrefs, firstDay: "mon", timeFormat: "h24" }));
    fireEvent.click(screen.getByRole("radio", { name: "1.234,56" }));
    await waitFor(() => expect(screen.getByText("1.234.567,89")).toBeTruthy());
  });
});

describe("ThemeSettings", () => {
  // The preview follows the OS scheme; jsdom has no matchMedia.
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("is read-only without onSave and the preview is still playable", () => {
    render(<ThemeSettings prefs={theme.getThemePrefs} previewTasks={theme.previewTasks} workspace="Ridgeline" />);
    expect(screen.getByText("Customise how Ridgeline looks on this device.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();
    expect((screen.getByRole("switch", { name: /Show sidebar icons/ }) as HTMLButtonElement).disabled ?? true).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Complete “QA the onboarding emails” in the preview" }));
    expect(screen.getByRole("button", { name: "Reopen “QA the onboarding emails” in the preview" })).toBeTruthy();
  });

  it("saves each change, shows Saved and resets to the defaults", async () => {
    const onSave = vi.fn(async () => {});
    render(<ThemeSettings defaults={theme.factoryPrefs} onSave={onSave} prefs={theme.getThemePrefs} previewTasks={theme.previewTasks} workspace="Ridgeline" />);
    fireEvent.click(screen.getByRole("radio", { name: "Rose" }));
    expect(onSave).toHaveBeenLastCalledWith({ ...theme.factoryPrefs, accent: "rose" });
    expect(await screen.findByText("Saved")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "Compact" }));
    await waitFor(() => expect(onSave).toHaveBeenLastCalledWith({ ...theme.factoryPrefs, accent: "rose", density: "compact" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(onSave).toHaveBeenLastCalledWith(theme.factoryPrefs));
  });
});

describe("ConnectorMarketplace", () => {
  beforeEach(() => {
    Element.prototype.scrollTo = () => {};
  });
  const renderIt = (props: Partial<Parameters<typeof ConnectorMarketplace>[0]> = {}) =>
    render(<ConnectorMarketplace apps={connectors.listConnectorApps} workspace="Northwind" {...props} />);

  it("is a read-only directory without actions", () => {
    renderIt();
    expect(screen.getByRole("heading", { name: "Integrations" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Connect / })).toBeNull();
    expect(screen.getByRole("button", { name: "Relay" })).toBeTruthy();
  });

  it("connects, shows a failure with retry, and filters", async () => {
    let attempts = 0;
    const onConnect = vi.fn(async (id: string) => {
      if (id === "silo" && attempts++ === 0) return fail("Silo rejected the token.");
    });
    renderIt({ onConnect });
    fireEvent.click(screen.getByRole("button", { name: "Connect Silo" }));
    expect(await screen.findByText("Authorization failed. Retry to try again.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry connecting Silo" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Retry connecting Silo" })).toBeNull());
    expect(onConnect).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("radio", { name: "Connected" }));
    expect(screen.getByRole("button", { name: "Silo" })).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Postbox" })).toBeNull());
  });

  it("disconnects and changes settings from the details sheet", async () => {
    const onDisconnect = vi.fn(async () => {});
    const onSettingChange = vi.fn(async () => {});
    renderIt({ onConnect: async () => {}, onDisconnect, onSettingChange });
    fireEvent.click(screen.getByRole("button", { name: "Relay" }));
    const sheet = await screen.findByRole("dialog");
    fireEvent.click(within(sheet).getByRole("switch", { name: /Allow agents to write/ }));
    expect(onSettingChange).toHaveBeenCalledWith({ appId: "relay", settingId: "agents", on: true });
    fireEvent.click(within(sheet).getByRole("button", { name: "Disconnect" }));
    expect(onDisconnect).toHaveBeenCalledWith("relay");
    expect(await within(sheet).findByText("Connect Relay to change its settings.")).toBeTruthy();
  });

  it("requests a missing app from an empty search", async () => {
    const onRequestApp = vi.fn(async () => {});
    renderIt({ onRequestApp });
    fireEvent.change(screen.getByRole("searchbox", { name: "Search apps" }), { target: { value: "Zapline" } });
    expect(screen.getByText("No apps match “Zapline”")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Request “Zapline”" }));
    expect(onRequestApp).toHaveBeenCalledWith("Zapline");
    expect(await screen.findByText("Requested · we’ll email you")).toBeTruthy();
  });
});
