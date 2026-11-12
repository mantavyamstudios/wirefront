// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The members table's wiring contract, as a builder relies on it: the query
 * it reports, what the actions receive, and how it shows pending, failed and
 * empty states.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail, ok } from "@wirefront/ui/wirefront/types";
import * as fixtures from "@/pages/showcase/table-members/fixtures";
import { api } from "@/pages/showcase/table-members/schema";
import { type MembersListQuery, MembersTable } from "@/pages/showcase/table-members/view";

afterEach(cleanup);

const query: MembersListQuery = { page: 1, pageSize: 20 };
const now = () => new Date(fixtures.now);

function renderTable(props: Partial<ComponentProps<typeof MembersTable>> = {}, can?: (action: string) => boolean) {
  const onQueryChange = vi.fn();
  render(
    <WirefrontProvider can={can} now={now}>
      <MembersTable members={fixtures.members} onQueryChange={onQueryChange} query={query} total={fixtures.members.length} {...props} />
    </WirefrontProvider>,
  );
  return { onQueryChange };
}

const row = (name: string) => {
  const cell = screen.getByText(name).closest("tr");
  if (!cell) throw new Error(`no row for ${name}`);
  return cell;
};

async function openActions(name: string) {
  const trigger = screen.getByRole("button", { name: `Actions for ${name}` });
  fireEvent.click(trigger);
  return screen.findByRole("menu");
}

describe("MembersTable", () => {
  it("renders the page it is given, with relative times from the provider's clock", () => {
    renderTable();
    expect(screen.getByText("6 people")).toBeTruthy();
    expect(within(row("Grace Hopper")).getByText("2 minutes ago")).toBeTruthy();
    expect(within(row("Edsger Dijkstra")).getAllByText("Invited").length).toBeGreaterThan(0);
  });

  it("reports search, filter, sort and paging as a query, starting again at page 1", () => {
    const { onQueryChange } = renderTable({ query: { page: 2, pageSize: 2 }, total: 6 });
    fireEvent.change(screen.getByRole("searchbox", { name: "Search members" }), { target: { value: "ada" } });
    expect(onQueryChange).toHaveBeenLastCalledWith({ page: 1, pageSize: 2, search: "ada" });

    fireEvent.click(screen.getByRole("button", { name: "Member" }));
    expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, sort: { id: "name", direction: "asc" } }));

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ page: 3, pageSize: 2 });
    expect(screen.getByText("3–4 of 6")).toBeTruthy();
  });

  it("shows a role change at once and rolls it back when the backend refuses", async () => {
    const onRoleChange = vi.fn(async () => fail("Only owners can make admins."));
    renderTable({ onRoleChange });
    const menu = await openActions("Linus Torvalds");
    fireEvent.click(within(menu).getByRole("menuitemradio", { name: "Admin" }));

    expect(onRoleChange).toHaveBeenCalledWith({ id: "mem_linus", role: "admin" });
    expect((await screen.findByRole("alert")).textContent).toBe("Only owners can make admins.");
    await waitFor(() => expect(within(row("Linus Torvalds")).getAllByText("Member").length).toBeGreaterThan(0));
  });

  it("removes a member only after the user confirms", async () => {
    const onRemove = vi.fn(async () => ok(undefined));
    renderTable({ onRemove });
    const menu = await openActions("Alan Turing");
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Remove" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(onRemove).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith("mem_alan");
    await waitFor(() => expect(screen.queryByText("Alan Turing")).toBeNull());
  });

  it("invites with a validated email and role, then closes", async () => {
    const onInvite = vi.fn(async () => ok(fixtures.inviteMember));
    renderTable({ onInvite });
    fireEvent.click(screen.getByRole("button", { name: "Invite" }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: "Send invite" }));
    expect(await within(dialog).findByText("Enter a valid email address.")).toBeTruthy();
    expect(onInvite).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText("Email"), { target: { value: "barbara@liskov.dev" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Send invite" }));
    await waitFor(() => expect(onInvite).toHaveBeenCalledWith({ email: "barbara@liskov.dev", role: "member" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("hides management the builder hasn't wired or the user may not do", () => {
    renderTable({ onInvite: vi.fn(), onRemove: vi.fn(), onRoleChange: vi.fn() }, () => false);
    expect(screen.queryByRole("button", { name: "Invite" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Role for Linus Torvalds" })).toBeNull();
    cleanup();
    renderTable();
    expect(screen.queryByRole("button", { name: "Invite" })).toBeNull();
  });

  it("shows loading, error and empty states", () => {
    renderTable({ status: "loading" });
    expect(screen.queryByText("Ada Lovelace")).toBeNull();
    cleanup();

    const onRetry = vi.fn();
    renderTable({ status: "error", error: "Timed out.", onRetry });
    expect(screen.getByText("Timed out.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
    cleanup();

    const { onQueryChange } = renderTable({ members: [], total: 0, query: { ...query, search: "zed" } });
    expect(screen.getByText("No members match")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, search: undefined, filters: undefined });
  });

  it("describes its backend operations", () => {
    expect(Object.keys(api)).toEqual(["listMembers", "inviteMember", "updateMemberRole", "removeMember", "transferOwnership"]);
    expect(api.listMembers.response.parse(fixtures.listMembers).total).toBe(6);
  });
});
