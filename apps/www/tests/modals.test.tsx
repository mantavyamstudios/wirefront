// SPDX-License-Identifier: AGPL-3.0-only
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
