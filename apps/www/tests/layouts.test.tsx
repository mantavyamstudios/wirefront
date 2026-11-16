// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the layout frames converted in Phase 7.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { HomeIcon, InboxIcon } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as docsFixtures from "@/pages/showcase/sidebars-docs-tree/fixtures";
import { DocsTreeShell } from "@/pages/showcase/sidebars-docs-tree/view";
import * as inboxFixtures from "@/pages/showcase/sidebars-inbox-rail/fixtures";
import { InboxRail } from "@/pages/showcase/sidebars-inbox-rail/view";
import * as miniFixtures from "@/pages/showcase/sidebars-mini-rail/fixtures";
import { MiniRailShell } from "@/pages/showcase/sidebars-mini-rail/view";
import * as railFixtures from "@/pages/showcase/sidebars-workspace-rail/fixtures";
import { WorkspaceRailShell } from "@/pages/showcase/sidebars-workspace-rail/view";

afterEach(cleanup);

describe("MiniRailShell", () => {
  const items = [
    { id: "home", label: "Home", href: "/home", icon: <HomeIcon /> },
    { id: "inbox", label: "Inbox", href: "/inbox", icon: <InboxIcon />, count: 4 },
  ];

  it("renders the page, links destinations with unread counts and switches workspace", () => {
    const onSwitchWorkspace = vi.fn();
    render(
      <MiniRailShell activeId="inbox" currentWorkspaceId="acme" items={items} onSwitchWorkspace={onSwitchWorkspace} user={miniFixtures.user} workspaces={miniFixtures.listWorkspaces}>
        <p>Page body</p>
      </MiniRailShell>,
    );
    expect(screen.getByText("Page body")).toBeTruthy();
    const inbox = screen.getAllByRole("link", { name: /Inbox, 4 unread/ });
    expect(inbox[0]?.getAttribute("href")).toBe("/inbox");
    expect(inbox[0]?.getAttribute("aria-current")).toBe("page");
    fireEvent.click(screen.getByRole("button", { name: "Switch to Bluefin" }));
    expect(onSwitchWorkspace).toHaveBeenCalledWith("bluefin");
    expect(screen.queryByRole("button", { name: "Add workspace" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Settings" })).toBeNull();
  });
});

describe("WorkspaceRailShell", () => {
  it("renders sections as links, runs section actions and opens search on Ctrl+K", () => {
    const onSearch = vi.fn();
    const onNew = vi.fn();
    render(
      <WorkspaceRailShell
        activeId="q3"
        context={railFixtures.getRailContext}
        onSearch={onSearch}
        sections={[
          { id: "main", items: [{ id: "inbox", label: "Inbox", href: "/inbox", count: 4, unread: true }] },
          { id: "projects", label: "Projects", items: [{ id: "q3", label: "Q3 planning", href: "/p/q3", color: 3 }], action: { label: "New project", onClick: onNew } },
        ]}
      >
        <p>Page body</p>
      </WorkspaceRailShell>,
    );
    expect(screen.getAllByRole("link", { name: "Q3 planning" })[0]?.getAttribute("aria-current")).toBe("page");
    expect(screen.getAllByText("4 unread").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "New project" })[0] as HTMLElement);
    expect(onNew).toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /Switch workspace/ })).toBeNull();
  });
});

describe("DocsTreeShell", () => {
  it("opens the active page's folders, links pages and toggles folders", () => {
    render(
      <DocsTreeShell activeId="events-projector" tree={docsFixtures.getDocsTree}>
        <p>Doc</p>
      </DocsTreeShell>,
    );
    const nav = screen.getAllByRole("navigation", { name: "Documentation" })[0] as HTMLElement;
    expect(within(nav).getByRole("link", { name: "Projectors" }).getAttribute("aria-current")).toBe("page");
    const guides = within(nav).getByRole("button", { name: "Guides" });
    expect(guides.getAttribute("aria-expanded")).toBe("false");
    expect(within(nav).queryByRole("link", { name: "Write a job" })).toBeNull();
    fireEvent.click(guides);
    expect(guides.getAttribute("aria-expanded")).toBe("true");
    expect(within(nav).getByRole("link", { name: "Write a job" }).getAttribute("href")).toBe("#add-job");
    expect(screen.queryByRole("button", { name: "New page" })).toBeNull();
  });

  it("opens search on '/' outside text fields", () => {
    const onSearch = vi.fn();
    render(
      <DocsTreeShell onSearch={onSearch} tree={docsFixtures.getDocsTree}>
        <input aria-label="field" />
      </DocsTreeShell>,
    );
    fireEvent.keyDown(screen.getByRole("textbox", { name: "field" }), { key: "/" });
    expect(onSearch).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "/" });
    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});

describe("InboxRail", () => {
  it("filters, selects threads, dates them from the clock and archives read", async () => {
    const onFilterChange = vi.fn();
    const onSelect = vi.fn();
    const onArchiveRead = vi.fn(async () => {});
    render(
      <WirefrontProvider locale="en-US" now={() => new Date(inboxFixtures.now)}>
        <InboxRail filter="all" onArchiveRead={onArchiveRead} onFilterChange={onFilterChange} onSelect={onSelect} selectedId="3" threads={inboxFixtures.threads} unread={3}>
          <p>Conversation</p>
        </InboxRail>
      </WirefrontProvider>,
    );
    expect(screen.getByText("3 unread")).toBeTruthy();
    expect(screen.getByText("2 minutes ago")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /Unread/ }));
    expect(onFilterChange).toHaveBeenCalledWith("unread");
    fireEvent.click(screen.getByRole("button", { name: /James Lin/ }));
    expect(onSelect).toHaveBeenCalledWith("2");
    expect(screen.getByRole("button", { name: /Riya Patel/ }).getAttribute("aria-current")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Archive read" }));
    await waitFor(() => expect(onArchiveRead).toHaveBeenCalled());
  });
});
