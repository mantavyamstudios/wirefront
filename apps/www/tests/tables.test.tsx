// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the invoices, API keys, audit log and admin users tables.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail, ok } from "@wirefront/ui/wirefront/types";
import * as adminFixtures from "@/pages/showcase/table-admin-users/fixtures";
import { AdminUsers, type AdminUsersProps } from "@/pages/showcase/table-admin-users/view";
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

describe("AdminUsers", () => {
  const props = (overrides: Partial<AdminUsersProps> = {}): AdminUsersProps => ({
    users: adminFixtures.listUsers.items,
    total: adminFixtures.listUsers.total,
    summary: adminFixtures.listUsers.summary,
    query: { page: 1, pageSize: 20 },
    onQueryChange: vi.fn(),
    orgName: "Larkfield Studio",
    currentUserId: "u1",
    ...overrides,
  });
  const renderAt = (p: AdminUsersProps) =>
    render(
      <WirefrontProvider now={() => new Date(adminFixtures.now)}>
        <AdminUsers {...p} />
      </WirefrontProvider>,
    );
  const table = () => within(screen.getByRole("table"));

  it("shows the server's org-wide numbers and reports tab, search and sort changes", () => {
    const p = props();
    renderAt(p);
    expect(screen.getByText("70%")).toBeTruthy();
    expect(screen.getByText("3 active members without 2FA")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Suspended/ }));
    expect(p.onQueryChange).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, filters: { status: "suspended" } });
    fireEvent.change(screen.getByLabelText("Search members"), { target: { value: "design" } });
    expect(p.onQueryChange).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, search: "design" });
    fireEvent.click(table().getByRole("button", { name: "Last active" }));
    expect(p.onQueryChange).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, sort: { id: "lastActiveAt", direction: "asc" } });
  });

  it("hides every action that isn't wired", () => {
    renderAt(props());
    expect(screen.queryByRole("button", { name: /Invite members/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Role for/ })).toBeNull();
  });

  it("changes a role at once and rolls it back with an alert when the backend refuses", async () => {
    const onRoleChange = vi.fn(async () => fail("Only owners can make admins."));
    renderAt(props({ onRoleChange }));
    fireEvent.click(table().getByRole("button", { name: "Role for Jonas Weber: Member" }));
    fireEvent.click(await screen.findByRole("menuitemradio", { name: /^Admin/ }));
    await waitFor(() => expect(onRoleChange).toHaveBeenCalledWith({ ids: ["u4"], role: "admin" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Only owners can make admins.");
    expect(table().getByRole("button", { name: "Role for Jonas Weber: Member" })).toBeTruthy();
  });

  it("bulk-suspends selected active people, never the signed-in admin, and removes only after confirming", async () => {
    const onSuspend = vi.fn(async () => {});
    const onRemove = vi.fn(async () => {});
    renderAt(props({ onSuspend, onRemove }));
    expect(table().queryByRole("checkbox", { name: "Select Maya Lindgren" })).toBeNull();
    fireEvent.click(table().getByRole("checkbox", { name: "Select Jonas Weber" }));
    fireEvent.click(table().getByRole("checkbox", { name: "Select Sam Okoro" }));
    const bar = within(screen.getByRole("toolbar", { name: "Bulk actions" }));
    fireEvent.click(bar.getByRole("button", { name: /Suspend/ }));
    await waitFor(() => expect(onSuspend).toHaveBeenCalledWith(["u4"]));

    fireEvent.click(bar.getByRole("button", { name: /Remove/ }));
    expect(onRemove).not.toHaveBeenCalled();
    const dialog = within(await screen.findByRole("alertdialog"));
    expect(dialog.getByText("Remove 2 members?")).toBeTruthy();
    fireEvent.click(dialog.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith(["u4", "u10"]));
  });

  it("invites valid addresses with the chosen role and blocks malformed ones", async () => {
    const onInvite = vi.fn(async () => {});
    renderAt(props({ onInvite }));
    fireEvent.click(screen.getByRole("button", { name: /Invite members/ }));
    const input = await screen.findByLabelText("Email addresses");
    fireEvent.change(input, { target: { value: "ada@x.dev, nope," } });
    expect(screen.getByText("“nope” doesn’t look like an email. Remove or fix it.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Send/ }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Remove nope" }));
    fireEvent.click(screen.getByRole("radio", { name: /Viewer/ }));
    fireEvent.click(screen.getByRole("button", { name: /Send invite/ }));
    await waitFor(() => expect(onInvite).toHaveBeenCalledWith({ emails: ["ada@x.dev"], role: "viewer" }));
    expect(await screen.findByText("1 invite sent")).toBeTruthy();
  });

  it("loads devices and activity for the person whose details are open", async () => {
    const loadDetails = vi.fn(async () => adminFixtures.getUserDetails);
    renderAt(props({ loadDetails }));
    fireEvent.click(table().getByRole("button", { name: "Owen Adeyemi" }));
    await waitFor(() => expect(loadDetails).toHaveBeenCalledWith("u2"));
    expect(await screen.findByText("Created API key “CI deploy”")).toBeTruthy();
    expect(screen.getByText("MacBook Pro · Chrome")).toBeTruthy();
  });
});
