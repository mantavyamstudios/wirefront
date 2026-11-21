// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the modal screens and the shared no-results pattern.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail, ok } from "@wirefront/ui/wirefront/types";
import * as paletteFixtures from "@/pages/showcase/modals-command-palette/fixtures";
import { CommandPalette } from "@/pages/showcase/modals-command-palette/view";
import * as deleteFixtures from "@/pages/showcase/modals-confirm-delete/fixtures";
import { ConfirmDelete } from "@/pages/showcase/modals-confirm-delete/view";
import { CreateWorkspace } from "@/pages/showcase/modals-create-workspace/view";
import { slugify } from "@/pages/showcase/modals-create-workspace/schema";
import { ExportDialog } from "@/pages/showcase/modals-export/view";
import * as exportFixtures from "@/pages/showcase/modals-export/fixtures";
import { SendFeedback } from "@/pages/showcase/modals-feedback/view";
import * as shareFixtures from "@/pages/showcase/modals-share-link/fixtures";
import { ShareDialog } from "@/pages/showcase/modals-share-link/view";
import * as shortcutFixtures from "@/pages/showcase/modals-shortcuts/fixtures";
import { ShortcutsDialog } from "@/pages/showcase/modals-shortcuts/view";
import * as tfaFixtures from "@/pages/showcase/modals-two-factor/fixtures";
import { TwoFactorSetup } from "@/pages/showcase/modals-two-factor/view";
import * as upgradeFixtures from "@/pages/showcase/modals-upgrade/fixtures";
import { UpgradeDialog } from "@/pages/showcase/modals-upgrade/view";
import * as uploadFixtures from "@/pages/showcase/modals-upload-files/fixtures";
import { UploadDialog } from "@/pages/showcase/modals-upload-files/view";
import { NoResults, NoResultsState } from "@/pages/showcase/empty-no-results/view";

afterEach(cleanup);

describe("ConfirmDelete", () => {
  it("spells out what is lost, and deletes only once the phrase is typed", async () => {
    const onDelete = vi.fn(async () => {});
    const onDeleted = vi.fn();
    render(<ConfirmDelete defaultOpen onDelete={onDelete} onDeleted={onDeleted} workspace={deleteFixtures.getWorkspaceSummary} />);
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/12 projects, 84 documents, and revokes access for 28 members\. Backups retained for 30 days\./)).toBeTruthy();
    const confirm = within(dialog).getByRole("button", { name: "Delete forever" });
    expect(confirm.hasAttribute("disabled")).toBe(true);

    fireEvent.change(within(dialog).getByLabelText(/to confirm/), { target: { value: "delete acme-prod" } });
    fireEvent.click(confirm);
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(onDelete).toHaveBeenCalledWith("ws_acme");
  });

  it("uses singular words for one, in the provider's locale", async () => {
    render(
      <ConfirmDelete defaultOpen onDelete={vi.fn()} workspace={{ id: "w", slug: "solo", projects: 1, documents: 1, members: 1 }} />,
    );
    expect(await screen.findByText("This permanently deletes 1 project, 1 document, and revokes access for 1 member.")).toBeTruthy();
  });

  it("keeps the dialog open and shows the error when deletion fails", async () => {
    render(<ConfirmDelete defaultOpen onDelete={async () => fail("Only the owner can delete it.")} workspace={deleteFixtures.getWorkspaceSummary} />);
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.change(within(dialog).getByLabelText(/to confirm/), { target: { value: "delete acme-prod" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete forever" }));
    expect((await within(dialog).findByRole("alert")).textContent).toBe("Only the owner can delete it.");
  });
});

describe("CreateWorkspace", () => {
  it("slugifies the name the same way on both sides", () => {
    expect(slugify("  Acme Studios! 2026 ")).toBe("acme-studios-2026");
  });

  it("sends the name, slug and visibility, and reports the workspace", async () => {
    const workspace = { id: "ws", name: "Acme studios", slug: "acme-studios", visibility: "team" as const };
    const onCreate = vi.fn(async () => ok(workspace));
    const onCreated = vi.fn();
    render(<CreateWorkspace defaultName="Acme studios" defaultOpen onCreate={onCreate} onCreated={onCreated} teamDomain="acme.dev" urlPrefix="acme.dev/" />);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("acme-studios")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("radio", { name: /Public/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Create workspace" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(workspace));
    expect(onCreate).toHaveBeenCalledWith({ name: "Acme studios", visibility: "public", slug: "acme-studios" });
  });

  it("hides the Team option without a company domain, and blocks a taken URL", async () => {
    const checkSlug = vi.fn(async () => false);
    render(<CreateWorkspace checkSlug={checkSlug} defaultName="Acme" defaultOpen onCreate={vi.fn()} urlPrefix="acme.dev/" />);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("radio", { name: /Team/ })).toBeNull();
    expect(await within(dialog).findByText("taken", {}, { timeout: 2000 })).toBeTruthy();
    expect(checkSlug).toHaveBeenCalledWith("acme");
    expect(within(dialog).getByRole("button", { name: "Create workspace" }).hasAttribute("disabled")).toBe(true);
  });
});

describe("CommandPalette", () => {
  it("runs the chosen entry and closes", async () => {
    const onSelect = vi.fn();
    render(
      <WirefrontProvider>
        <CommandPalette defaultOpen groups={[...paletteFixtures.actions, ...paletteFixtures.searchCommands]} onSelect={onSelect} />
      </WirefrontProvider>,
    );
    fireEvent.click(await screen.findByText("design-system"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "prj_design", kind: "project" }));
    await waitFor(() => expect(screen.queryByPlaceholderText("Type a command or search…")).toBeNull());
  });

  it("reports what the user types", async () => {
    const onQueryChange = vi.fn();
    render(<CommandPalette defaultOpen groups={paletteFixtures.actions} onQueryChange={onQueryChange} onSelect={vi.fn()} />);
    fireEvent.change(await screen.findByPlaceholderText("Type a command or search…"), { target: { value: "hand" } });
    expect(onQueryChange).toHaveBeenLastCalledWith("hand");
  });
});

describe("NoResults", () => {
  it("removes one filter, clears all, and resets the search", () => {
    const onRemoveFilter = vi.fn();
    const onClearFilters = vi.fn();
    const onQueryChange = vi.fn();
    render(
      <NoResults
        filters={[{ id: "status", label: "status:open" }]}
        onClearFilters={onClearFilters}
        onQueryChange={onQueryChange}
        onRemoveFilter={onRemoveFilter}
        query="zed"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove status:open" }));
    expect(onRemoveFilter).toHaveBeenCalledWith("status");
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearFilters).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Reset search" }));
    expect(onQueryChange).toHaveBeenCalledWith("");
  });

  it("offers only the actions that apply", () => {
    render(<NoResultsState onClearFilters={vi.fn()} onClearSearch={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reset search" })).toBeNull();
  });
});

describe("SendFeedback", () => {
  it("validates, sends the kind, message, logs choice and screenshot, then closes", async () => {
    const onSend = vi.fn(async () => {});
    render(<SendFeedback defaultOpen onSend={onSend} product="Acme" />);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Something that would make Acme better.")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Send feedback" }));
    expect(await within(dialog).findByText("Tell us a little more first.")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("radio", { name: /broken/ }));
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Your feedback" }), { target: { value: "Export button does nothing" } });
    const shot = new File(["x"], "shot.png", { type: "image/png" });
    fireEvent.change(within(dialog).getByLabelText("Attach screenshot", { selector: "input" }), { target: { files: [shot] } });
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Include console logs" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Send feedback" }));
    await waitFor(() => expect(onSend).toHaveBeenCalledWith({ kind: "bug", message: "Export button does nothing", includeLogs: false, screenshot: shot }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});

describe("ShareDialog", () => {
  const renderIt = (extra: Partial<Parameters<typeof ShareDialog>[0]> = {}) =>
    render(
      <ShareDialog
        defaultOpen
        documentName={shareFixtures.documentName}
        linkAccess="view"
        linkUrl={shareFixtures.listAccess.linkUrl}
        members={shareFixtures.members}
        onInvite={vi.fn(async () => {})}
        {...extra}
      />,
    );

  it("invites by email with the chosen role and refuses bad addresses", async () => {
    const onInvite = vi.fn(async () => {});
    renderIt({ onInvite });
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByRole("textbox", { name: "Add people by email" });
    fireEvent.change(input, { target: { value: "ana@acme.dev, nope" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Invite" }));
    expect((await within(dialog).findByRole("alert")).textContent).toBe("One of those isn’t an email address.");
    fireEvent.change(input, { target: { value: "ana@acme.dev, bo@acme.dev" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Invite" }));
    await waitFor(() => expect(onInvite).toHaveBeenCalledWith({ emails: ["ana@acme.dev", "bo@acme.dev"], role: "editor" }));
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(""));
  });

  it("keeps roles read-only when unwired and owners always", async () => {
    renderIt();
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: /James Lin:/ })).toBeNull();
    expect(within(dialog).getByText("Owner")).toBeTruthy();
    expect(within(dialog).getByText("People with access · 4")).toBeTruthy();
  });

  it("removes access optimistically and restores it when that fails", async () => {
    const onRemove = vi.fn(async () => fail("You can’t remove the last editor."));
    renderIt({ onRemove });
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Dani Kim: Editor" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Remove access" }));
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith("m4"));
    expect((await within(dialog).findByRole("alert")).textContent).toBe("You can’t remove the last editor.");
    expect(within(dialog).getByText("Dani Kim")).toBeTruthy();
  });
});

describe("ShortcutsDialog", () => {
  it("searches shortcuts and opens on its own key combination", async () => {
    render(<ShortcutsDialog footerNote="v3.4" groups={shortcutFixtures.groups} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(window, { key: "/", ctrlKey: true });
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("19 total")).toBeTruthy();
    fireEvent.change(within(dialog).getByRole("searchbox", { name: "Search shortcuts" }), { target: { value: "undo" } });
    expect(within(dialog).getByText("Undo")).toBeTruthy();
    expect(within(dialog).queryByText("Bold")).toBeNull();
    fireEvent.change(within(dialog).getByRole("searchbox", { name: "Search shortcuts" }), { target: { value: "zzz" } });
    expect(within(dialog).getByText("No shortcuts match “zzz”.")).toBeTruthy();
  });
});

describe("UpgradeDialog", () => {
  it("formats prices, says which limit was hit and starts the upgrade for the chosen plan", async () => {
    const onChoosePlan = vi.fn(async () => fail("Card on file expired."));
    render(<UpgradeDialog currentPlan="Free" defaultOpen limit={upgradeFixtures.limit} onChoosePlan={onChoosePlan} plans={upgradeFixtures.listUpgradePlans} />);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Limit reached · 10 / 10 projects")).toBeTruthy();
    expect(within(dialog).getByText("$79")).toBeTruthy();
    expect(within(dialog).queryByRole("link", { name: /comparison/ })).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: "Upgrade to Business" }));
    await waitFor(() => expect(onChoosePlan).toHaveBeenCalledWith("business"));
    expect((await within(dialog).findByRole("alert")).textContent).toBe("Card on file expired.");
  });
});

describe("ExportDialog", () => {
  it("sends the format, the range from the provider's clock and the sections, and needs at least one section", async () => {
    const onExport = vi.fn(async () => {});
    render(
      <WirefrontProvider locale="en-US" now={() => new Date(exportFixtures.now)} timeZone="UTC">
        <ExportDialog defaultOpen onExport={onExport} sections={exportFixtures.sections} />
      </WirefrontProvider>,
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Mar 26 – Apr 25, 2026")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("radio", { name: /JSON/ }));
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Summary metrics" }));
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "All events" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Export" }));
    expect((await within(dialog).findByRole("alert")).textContent).toBe("Pick at least one thing to export.");
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Raw payloads" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Export" }));
    await waitFor(() =>
      expect(onExport).toHaveBeenCalledWith({ format: "json", from: "2026-03-26T12:00:00.000Z", to: "2026-04-25T12:00:00.000Z", include: ["raw"] }),
    );
  });
});

describe("UploadDialog", () => {
  it("shows each upload's progress and state, refuses big files and offers the right action per state", async () => {
    const onAddFiles = vi.fn();
    const onCancel = vi.fn();
    const onResume = vi.fn();
    const uploads = [...uploadFixtures.uploads, { id: "u9", name: "broken.pdf", size: 1000, progress: 30, state: "failed" as const, error: "Network dropped." }];
    render(<UploadDialog defaultOpen maxSizeMb={1} onAddFiles={onAddFiles} onCancel={onCancel} onResume={onResume} typesLabel="png, pdf" uploads={uploads} />);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("1 of 5 complete")).toBeTruthy();
    expect(within(dialog).getByRole("progressbar", { name: "homepage-hero.png progress" }).getAttribute("aria-valuenow")).toBe("76");
    expect(within(dialog).getByRole("img", { name: "brand-system-2026.fig uploaded" })).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel annual-report.pdf" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Resume moodboard-04.zip" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Retry broken.pdf" }));
    expect(onCancel).toHaveBeenCalledWith("u3");
    expect(onResume.mock.calls).toEqual([["u4"], ["u9"]]);
    expect(within(dialog).getByText("Network dropped.")).toBeTruthy();
    expect(within(dialog).queryByRole("button", { name: "Cancel all" })).toBeNull();

    const pick = (files: File[]) => fireEvent.change(within(dialog).getByLabelText("Upload files", { selector: "input" }), { target: { files } });
    pick([new File([new Uint8Array(2 * 1024 * 1024)], "huge.zip")]);
    expect(within(dialog).getByRole("alert").textContent).toBe("huge.zip is larger than 1 MB.");
    const small = new File(["x"], "a.png");
    pick([small]);
    expect(onAddFiles).toHaveBeenCalledWith([small]);
  });
});

describe("TwoFactorSetup", () => {
  it("needs all six digits, verifies the code and closes", async () => {
    const onVerify = vi.fn(async () => {});
    const onVerified = vi.fn();
    render(<TwoFactorSetup account="you@example.com" defaultOpen enrollment={tfaFixtures.startTotpEnrollment} onVerified={onVerified} onVerify={onVerify} step={{ current: 2, total: 3 }} />);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("H7K3 9F2N P8L4 RTYQ")).toBeTruthy();
    expect(within(dialog).getByText("Step 2 of 3")).toBeTruthy();
    expect(within(dialog).getByRole("link", { name: /Open authenticator app/ }).getAttribute("href")).toBe(tfaFixtures.startTotpEnrollment.otpauthUrl);
    fireEvent.click(within(dialog).getByRole("button", { name: "Verify and continue" }));
    expect((await within(dialog).findByRole("alert")).textContent).toBe("Enter all 6 digits.");
    [..."123456"].forEach((digit, i) => {
      const label = i === 0 ? "Confirm with a 6-digit code" : `Digit ${i + 1} of 6`;
      const input = within(dialog).getAllByLabelText(label).find((el) => el.tagName === "INPUT") as HTMLElement;
      fireEvent.change(input, { target: { value: digit } });
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Verify and continue" }));
    await waitFor(() => expect(onVerify).toHaveBeenCalledWith({ code: "123456" }));
    await waitFor(() => expect(onVerified).toHaveBeenCalled());
  });

  it("hides the QR column when the server sends no image", async () => {
    render(<TwoFactorSetup account="a" defaultOpen enrollment={{ ...tfaFixtures.startTotpEnrollment, qrCodeUrl: undefined }} onVerify={vi.fn()} />);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("img", { name: /QR code/ })).toBeNull();
    expect(within(dialog).getByText("Open your authenticator app and paste this setup key.")).toBeTruthy();
  });
});
