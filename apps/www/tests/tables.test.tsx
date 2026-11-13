// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the invoices, API keys, audit log, admin users, inventory, orders, issues, transactions and logs tables.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail, ok } from "@wirefront/ui/wirefront/types";
import * as adminFixtures from "@/pages/showcase/table-admin-users/fixtures";
import { AdminUsers, type AdminUsersProps } from "@/pages/showcase/table-admin-users/view";
import * as keyFixtures from "@/pages/showcase/table-api-keys/fixtures";
import { ApiKeysTable } from "@/pages/showcase/table-api-keys/view";
import * as auditFixtures from "@/pages/showcase/table-audit-log/fixtures";
import { AuditLog } from "@/pages/showcase/table-audit-log/view";
import * as inventoryFixtures from "@/pages/showcase/table-inventory/fixtures";
import { InventoryTable } from "@/pages/showcase/table-inventory/view";
import * as orderFixtures from "@/pages/showcase/table-orders/fixtures";
import { OrdersTable } from "@/pages/showcase/table-orders/view";
import * as issueFixtures from "@/pages/showcase/table-issues/fixtures";
import { IssuesTable } from "@/pages/showcase/table-issues/view";
import * as txFixtures from "@/pages/showcase/table-transactions/fixtures";
import { TransactionsTable } from "@/pages/showcase/table-transactions/view";
import * as logFixtures from "@/pages/showcase/table-logs/fixtures";
import { LogsTable } from "@/pages/showcase/table-logs/view";
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

describe("InventoryTable", () => {
  it("shows stock against capacity with a level, formats prices and sorts by column", () => {
    const onQueryChange = vi.fn();
    render(<InventoryTable onQueryChange={onQueryChange} page={inventoryFixtures.listInventory} productHref={(i) => `/p/${i.id}`} query={{ page: 1, pageSize: 6 }} />);
    expect(screen.getByText("124 products")).toBeTruthy();
    const meter = screen.getAllByRole("meter", { name: "Pocket notebook stock" })[0] as HTMLMeterElement;
    expect([meter.value, meter.max]).toEqual([6, 80]);
    expect(screen.getAllByText("Low stock").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Out of stock").length).toBeGreaterThan(0);
    expect(screen.getByText("$92.00")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Field hoodie" }).getAttribute("href")).toBe("/p/2");
    fireEvent.click(screen.getByRole("button", { name: "Stock" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ page: 1, pageSize: 6, sort: { id: "stock", direction: "asc" } });
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ page: 2, pageSize: 6 });
  });

  it("uses the low-stock threshold it is given and hides the add button when unwired", () => {
    render(<InventoryTable lowStockAt={50} onQueryChange={vi.fn()} page={inventoryFixtures.listInventory} query={{ page: 1, pageSize: 6 }} />);
    // Hoodie (38) is now low too.
    expect(screen.getAllByText("Low stock").length).toBe(2 * 2);
    expect(screen.queryByRole("link", { name: /Product/ })).toBeNull();
  });
});

describe("OrdersTable", () => {
  it("has no selection without bulk actions", () => {
    render(<OrdersTable onQueryChange={vi.fn()} page={orderFixtures.listOrders} query={{ page: 1, pageSize: 6 }} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.getByText("248 orders")).toBeTruthy();
    expect(screen.getAllByRole("img", { name: "Stage: Shipped" }).length).toBe(2);
  });

  it("marks the selected orders shipped and clears the selection", async () => {
    const onMarkShipped = vi.fn(async () => {});
    render(<OrdersTable onMarkShipped={onMarkShipped} onQueryChange={vi.fn()} page={orderFixtures.listOrders} query={{ page: 1, pageSize: 6 }} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select #A-2840" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select #A-2838" }));
    expect(screen.getAllByText("2 selected").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Mark shipped" })[0] as HTMLElement);
    await waitFor(() => expect(onMarkShipped).toHaveBeenCalledWith(["2840", "2838"]));
    await waitFor(() => expect(screen.queryByText("2 selected")).toBeNull());
  });

  it("links the label file, and keeps the selection when an action fails", async () => {
    const onPrintLabels = vi.fn(async () => ok(orderFixtures.printLabels));
    const onMarkShipped = vi.fn(async () => fail("Carrier API is down."));
    render(<OrdersTable onMarkShipped={onMarkShipped} onPrintLabels={onPrintLabels} onQueryChange={vi.fn()} page={orderFixtures.listOrders} query={{ page: 1, pageSize: 6 }} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Print labels" })[0] as HTMLElement);
    expect((await screen.findByRole("link", { name: "Download" })).getAttribute("href")).toBe(orderFixtures.printLabels.url);
    expect(onPrintLabels).toHaveBeenCalledWith(orderFixtures.orders.map((o) => o.id));
    fireEvent.click(screen.getAllByRole("button", { name: "Mark shipped" })[0] as HTMLElement);
    expect((await screen.findByRole("alert")).textContent).toBe("Carrier API is down.");
    expect(screen.getAllByText("6 selected").length).toBeGreaterThan(0);
  });
});

describe("IssuesTable", () => {
  const renderIt = (query = issueFixtures.defaultQuery, extra: Partial<Parameters<typeof IssuesTable>[0]> = {}) => {
    const onQueryChange = vi.fn();
    render(
      <WirefrontProvider locale="en-US" now={() => new Date(issueFixtures.now)}>
        <IssuesTable labels={issueFixtures.listLabels} onQueryChange={onQueryChange} page={issueFixtures.listIssues} people={issueFixtures.listPeople} query={query} {...extra} />
      </WirefrontProvider>,
    );
    return onQueryChange;
  };

  it("names status, priority, estimate and assignee for screen readers and dates updates from the provider's clock", () => {
    renderIt();
    const row = screen.getByText("Migrate billing webhook to v2 schema").closest("tr") as HTMLElement;
    expect(within(row).getAllByRole("img", { name: "Todo" }).length).toBeGreaterThan(0);
    expect(within(row).getAllByText("High").length).toBeGreaterThan(0);
    expect(within(row).getByText("8 points")).toBeTruthy();
    expect(within(row).getByText("Alan Turing")).toBeTruthy();
    expect(within(row).getByText("yesterday")).toBeTruthy();
    const unassigned = screen.getByText(/persist operator/).closest("tr") as HTMLElement;
    expect(within(unassigned).getByRole("img", { name: "Unassigned" })).toBeTruthy();
    expect(screen.getByText("1 filter")).toBeTruthy();
  });

  it("filters by facet, searches and sorts, each from page 1", async () => {
    const onQueryChange = renderIt({ page: 3, pageSize: 20 });
    fireEvent.change(screen.getByRole("searchbox", { name: "Search issues" }), { target: { value: "safari" } });
    expect(onQueryChange).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, search: "safari" });
    fireEvent.click(screen.getByRole("button", { name: "Filter by Label" }));
    fireEvent.click(await screen.findByRole("checkbox", { name: "perf" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, filters: { label: ["perf"] } });
    fireEvent.click(screen.getByRole("button", { name: "Priority" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, sort: { id: "priority", direction: "asc" } });
  });

  it("offers to clear filters when nothing matches, and links titles", () => {
    const onQueryChange = renderIt({ page: 1, pageSize: 20, search: "zzz" }, { page: { items: [], total: 0 } });
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, search: undefined, filters: undefined });
    cleanup();
    renderIt(undefined, { issueHref: (i) => `/issues/${i.key}` });
    expect(screen.getByRole("link", { name: /Realtime cursors/ }).getAttribute("href")).toBe("/issues/ENG-218");
  });
});

describe("TransactionsTable", () => {
  const renderIt = (extra: Partial<Parameters<typeof TransactionsTable>[0]> = {}) => {
    const onQueryChange = vi.fn();
    render(
      <WirefrontProvider locale="en-US" timeZone="UTC">
        <TransactionsTable accounts={txFixtures.listAccounts} onQueryChange={onQueryChange} page={txFixtures.listTransactions} query={txFixtures.defaultQuery} {...extra} />
      </WirefrontProvider>,
    );
    return onQueryChange;
  };

  it("signs amounts by direction, strikes failed ones and totals from the server's summary", () => {
    renderIt();
    expect(screen.getByText("+$13,130.00")).toBeTruthy();
    expect(screen.getByText("-$2,120.00", { selector: "div.font-heading" })).toBeTruthy();
    expect(screen.getByText("+$11,010.00")).toBeTruthy();
    const failed = screen.getByText("Failed charge").closest("tr") as HTMLElement;
    expect(within(failed).getByText("+$6,420.00").className).toContain("line-through");
    expect(within(failed).getByRole("img", { name: "Received" })).toBeTruthy();
    expect(screen.getByText("fee $9.90")).toBeTruthy();
    expect(screen.getByText("412 results")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Export CSV" })).toBeNull();
  });

  it("exports the current query and pages", async () => {
    const onExport = vi.fn(async () => {});
    const onQueryChange = renderIt({ onExport });
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    await waitFor(() => expect(onExport).toHaveBeenCalledWith(txFixtures.defaultQuery));
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...txFixtures.defaultQuery, page: 2 });
  });

  it("hides the account filter for a single account and clears filters when nothing matches", () => {
    const onQueryChange = renderIt({ accounts: [{ id: "op", label: "Operating" }], page: { items: [], total: 0, summary: { inflow: 0, outflow: 0, currency: "USD" } } });
    expect(screen.queryByRole("combobox", { name: "Account" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ page: 1, pageSize: 8, search: undefined, filters: undefined });
  });
});

describe("LogsTable", () => {
  // jsdom has no matchMedia; the sheet picks its side with useMediaQuery. Desktop here.
  const realMatchMedia = window.matchMedia;
  beforeAll(() => {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  });
  afterAll(() => {
    window.matchMedia = realMatchMedia;
  });
  const renderIt = (extra: Partial<Parameters<typeof LogsTable>[0]> = {}) => {
    const onFilterChange = vi.fn();
    render(
      <WirefrontProvider locale="en-US" timeZone="UTC">
        <LogsTable entries={logFixtures.entries} filter="" onFilterChange={onFilterChange} {...extra} />
      </WirefrontProvider>,
    );
    return onFilterChange;
  };
  const open = (message: RegExp) => fireEvent.click(screen.getByRole("button", { name: message }));

  it("formats times in the provider's zone, filters and focuses the filter on Ctrl+K", () => {
    const onFilterChange = renderIt();
    expect(screen.getByText("12:48:21.094")).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox", { name: "Filter logs" }), { target: { value: "severity:error" } });
    expect(onFilterChange).toHaveBeenCalledWith("severity:error");
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(document.activeElement).toBe(screen.getByRole("searchbox", { name: "Filter logs" }));
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
  });

  it("pauses and resumes the stream", () => {
    const onLiveChange = vi.fn();
    renderIt({ live: true, onLiveChange });
    expect(screen.getByText("live")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(onLiveChange).toHaveBeenCalledWith(false);
  });

  it("opens a line's details with timing shares, and offers error actions only on errors", async () => {
    const onRetryRequest = vi.fn(async () => {});
    renderIt({ onRetryRequest, traceHref: (e) => `/traces/${e.traceId}` });
    open(/^info at 12:48:21\.094: GET \/v1\/projects 200/);
    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText("24ms total")).toBeTruthy();
    expect(within(sheet).getByRole("link", { name: "Open in tracing" }).getAttribute("href")).toBe("/traces/tr_a91f3c8b6e5d04a1");
    expect(within(sheet).queryByRole("button", { name: "Retry request" })).toBeNull();
    fireEvent.keyDown(sheet, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    open(/^error at 12:48:22\.318/);
    const errorSheet = await screen.findByRole("dialog");
    fireEvent.click(within(errorSheet).getByRole("button", { name: "Retry request" }));
    await waitFor(() => expect(onRetryRequest).toHaveBeenCalledWith(expect.objectContaining({ id: "e_5" })));
    expect(await within(errorSheet).findByText("Request retried.")).toBeTruthy();
    expect(within(errorSheet).queryByRole("button", { name: "Notify on-call" })).toBeNull();
  });

  it("says when copying fails", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn(async () => Promise.reject(new Error("denied"))) } });
    renderIt();
    open(/^warn at 12:48:21\.840/);
    const sheet = await screen.findByRole("dialog");
    fireEvent.click(within(sheet).getByRole("button", { name: "Copy" }));
    expect((await within(sheet).findByRole("alert")).textContent).toContain("Couldn’t copy");
  });
});
