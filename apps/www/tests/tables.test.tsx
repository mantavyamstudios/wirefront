// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the invoices, API keys and audit log tables.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { ok } from "@wirefront/ui/wirefront/types";
import * as keyFixtures from "@/pages/showcase/table-api-keys/fixtures";
import { ApiKeysTable } from "@/pages/showcase/table-api-keys/view";
import * as auditFixtures from "@/pages/showcase/table-audit-log/fixtures";
import { AuditLog } from "@/pages/showcase/table-audit-log/view";
import * as invoiceFixtures from "@/pages/showcase/table-invoices/fixtures";
import { InvoicesTable } from "@/pages/showcase/table-invoices/view";

afterEach(cleanup);

describe("InvoicesTable", () => {
  it("formats amounts in each invoice's currency and shows the server's outstanding total", () => {
    render(<InvoicesTable onQueryChange={vi.fn()} page={invoiceFixtures.listInvoices} query={{ page: 1, pageSize: 20 }} />);
    expect(screen.getAllByText("$12,780.00").length).toBeGreaterThan(0);
    // Open + overdue only: 4,800 + 9,900 + 12,780.
    expect(screen.getAllByText("$27,480.00").length).toBeGreaterThan(0);
  });

  it("reports filter and sort changes, and exports the current query", async () => {
    const onQueryChange = vi.fn();
    const onExport = vi.fn(async () => {});
    const query = { page: 2, pageSize: 20, search: "foundry" };
    render(<InvoicesTable onExport={onExport} onQueryChange={onQueryChange} page={invoiceFixtures.listInvoices} query={query} />);
    fireEvent.click(screen.getByRole("button", { name: "Amount" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...query, page: 1, sort: { id: "amount", direction: "asc" } });
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    await waitFor(() => expect(onExport).toHaveBeenCalledWith(query));
  });

  it("hides New invoice and Export unless wired", () => {
    render(<InvoicesTable onQueryChange={vi.fn()} page={invoiceFixtures.listInvoices} query={{ page: 1, pageSize: 20 }} />);
    expect(screen.queryByRole("button", { name: "Export" })).toBeNull();
    expect(screen.queryByText("New invoice")).toBeNull();
  });
});

describe("ApiKeysTable", () => {
  const renderKeys = (props: Partial<Parameters<typeof ApiKeysTable>[0]> = {}) =>
    render(
      <WirefrontProvider now={() => new Date(keyFixtures.now)}>
        <ApiKeysTable availableScopes={keyFixtures.scopes} keys={keyFixtures.listKeys} {...props} />
      </WirefrontProvider>,
    );

  it("never shows a secret in the list, only prefix and last four", () => {
    renderKeys();
    expect(screen.getAllByText("wf_live_8f4a••••91c2").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Reveal|Copy/ })).toBeNull();
  });

  it("creates a key with name, environment and scopes, then shows its secret once", async () => {
    const onCreate = vi.fn(async () => ok(keyFixtures.createKey));
    renderKeys({ onCreate });
    fireEvent.click(screen.getByRole("button", { name: "New key" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "Billing worker" } });
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "read" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Create key" }));
    expect(await screen.findByText(keyFixtures.createKey.secret)).toBeTruthy();
    expect(onCreate).toHaveBeenCalledWith({ name: "Billing worker", env: "live", scopes: ["read"] });
  });

  it("revokes after confirmation", async () => {
    const onRevoke = vi.fn(async () => {});
    renderKeys({ onRevoke });
    fireEvent.click(screen.getByRole("button", { name: "Actions for CI / Vercel" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Revoke" }));
    const confirm = await screen.findByRole("alertdialog");
    expect(onRevoke).not.toHaveBeenCalled();
    fireEvent.click(within(confirm).getByRole("button", { name: "Revoke" }));
    await waitFor(() => expect(screen.queryByText("CI / Vercel")).toBeNull());
    expect(onRevoke).toHaveBeenCalledWith("key_ci");
  });
});

describe("AuditLog", () => {
  it("shows times in the provider's time zone and system events without an actor", () => {
    render(
      <WirefrontProvider timeZone="Asia/Kolkata">
        <AuditLog entries={auditFixtures.entries} filters={[]} total={1284} />
      </WirefrontProvider>,
    );
    expect(screen.getAllByText("18:18:22").length).toBeGreaterThan(0);
    expect(screen.getAllByText("System").length).toBe(2);
    expect(screen.getByText("Security events · 7 of 1,284")).toBeTruthy();
  });

  it("removes filters and loads older entries when wired", async () => {
    const onRemoveFilter = vi.fn();
    const onLoadMore = vi.fn(async () => {});
    render(<AuditLog entries={auditFixtures.entries} filters={auditFixtures.filters} hasMore onLoadMore={onLoadMore} onRemoveFilter={onRemoveFilter} total={1284} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Actor filter" }));
    expect(onRemoveFilter).toHaveBeenCalledWith("actor");
    fireEvent.click(screen.getByRole("button", { name: "Load older →" }));
    await waitFor(() => expect(onLoadMore).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: /Edit .* filter value/ })).toBeNull();
  });
});
