// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the layout frames converted in Phase 7.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { HomeIcon, InboxIcon } from "lucide-react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as hairlineFixtures from "@/pages/showcase/layouts-hairline-shell/fixtures";
import { HairlineShell } from "@/pages/showcase/layouts-hairline-shell/view";
import * as canvasFixtures from "@/pages/showcase/layouts-canvas-tools/fixtures";
import { CanvasEditor } from "@/pages/showcase/layouts-canvas-tools/view";
import { BottomTabShell } from "@/pages/showcase/layouts-bottom-nav/view";
import { SelectionToolbar } from "@/pages/showcase/layouts-floating-toolbar/view";
import * as readerFixtures from "@/pages/showcase/layouts-focus-mode/fixtures";
import { FocusReader } from "@/pages/showcase/layouts-focus-mode/view";
import * as chatFixtures from "@/pages/showcase/layouts-three-pane/fixtures";
import { ChatWorkspace } from "@/pages/showcase/layouts-three-pane/view";
import * as mailFixtures from "@/pages/showcase/layouts-two-pane/fixtures";
import { MailTwoPane } from "@/pages/showcase/layouts-two-pane/view";
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
    expect(screen.getAllByRole("link", { name: "Inbox, 4 unread" }).length).toBeGreaterThan(0);
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
    expect(screen.getByRole("heading", { name: "Inbox" })).toBeTruthy();
    expect(screen.getByText(", 3 unread")).toBeTruthy();
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

describe("MailTwoPane", () => {
  const renderIt = (extra: Partial<Parameters<typeof MailTwoPane>[0]> = {}) => {
    const props = { onFilterChange: vi.fn(), onSearchChange: vi.fn(), onSelect: vi.fn() };
    render(
      <WirefrontProvider locale="en-US" now={() => new Date(mailFixtures.now)}>
        <MailTwoPane filter="all" messages={mailFixtures.messages} search="" selectedId="3" unread={5} {...props} {...extra} />
      </WirefrontProvider>,
    );
    return props;
  };

  it("lists, filters, searches and opens messages", () => {
    const { onFilterChange, onSearchChange, onSelect } = renderIt();
    expect(screen.getByText("5 unread")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "Unread" }));
    expect(onFilterChange).toHaveBeenCalledWith("unread");
    fireEvent.change(screen.getByRole("searchbox", { name: "Search threads" }), { target: { value: "dmarc" } });
    expect(onSearchChange).toHaveBeenCalledWith("dmarc");
    fireEvent.click(screen.getByRole("button", { name: /James Lin/ }));
    expect(onSelect).toHaveBeenCalledWith("2");
    expect(screen.getByRole("heading", { name: "Riya Patel" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Archive" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: /Reply to/ })).toBeNull();
  });

  it("needs text to reply, sends it and clears the box; archives the open message", async () => {
    const onReply = vi.fn(async () => {});
    const onArchive = vi.fn(async () => {});
    renderIt({ onReply, onArchive, messages: mailFixtures.messages.map((m) => (m.id === "3" ? { ...m, body: "Para one.\n\nPara two." } : m)) });
    expect(screen.getByText("Para two.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Write a reply first.");
    const box = screen.getByRole("textbox", { name: "Reply to Riya Patel" }) as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: "On it." } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(onReply).toHaveBeenCalledWith({ messageId: "3", body: "On it." }));
    await waitFor(() => expect(box.value).toBe(""));
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    await waitFor(() => expect(onArchive).toHaveBeenCalledWith("3"));
  });
});

describe("ChatWorkspace", () => {
  // jsdom has no matchMedia; the drawer asks useMediaQuery. Desktop here.
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

  const renderIt = (extra: Partial<Parameters<typeof ChatWorkspace>[0]> = {}) => {
    const props = { onSelect: vi.fn(), onSwitchWorkspace: vi.fn(), onSend: vi.fn(async () => {}) };
    render(
      <WirefrontProvider locale="en-US" now={() => new Date(chatFixtures.now)} timeZone="UTC">
        <ChatWorkspace
          activeId="design"
          channels={chatFixtures.channels}
          currentWorkspaceId="acme"
          directs={chatFixtures.directs}
          memberCount={16}
          messages={chatFixtures.listMessages}
          workspaces={chatFixtures.workspaces}
          {...props}
          {...extra}
        />
      </WirefrontProvider>,
    );
    return props;
  };

  it("groups messages by day, names presence and unread, and selects channels", () => {
    const { onSelect, onSwitchWorkspace } = renderIt();
    expect(screen.getByText("Yesterday")).toBeTruthy();
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ada Okafor, offline, 5 unread" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /engineering/ }));
    expect(onSelect).toHaveBeenCalledWith("engineering");
    fireEvent.click(screen.getByRole("button", { name: "Moss" }));
    expect(onSwitchWorkspace).toHaveBeenCalledWith("moss");
    expect(screen.getByText("3 replies")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /3 replies/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Members/ })).toBeNull();
  });

  it("sends on Enter, keeps Shift+Enter for new lines and clears after sending", async () => {
    const { onSend } = renderIt();
    const box = screen.getByRole("textbox", { name: "Message #design" }) as HTMLTextAreaElement;
    expect((screen.getByRole("button", { name: "Send" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(box, { target: { value: "Looks good" } });
    fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() => expect(onSend).toHaveBeenCalledWith({ channelId: "design", body: "Looks good" }));
    await waitFor(() => expect(box.value).toBe(""));
  });
});

describe("FocusReader", () => {
  it("starts focused, leaves focus on Esc and shows the rails and table of contents", () => {
    render(
      <FocusReader activeDocumentId="spacing" brand="Scratchpad" documents={readerFixtures.listDocuments} nav={[]} toc={readerFixtures.toc} user={readerFixtures.user}>
        <h1>Essay</h1>
      </FocusReader>,
    );
    expect(screen.getByRole("progressbar", { name: "Reading progress" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Exit focus mode" })).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Enter focus mode" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Notes on spacing" })[0]?.getAttribute("aria-current")).toBe("page");
    expect(screen.getAllByRole("link", { name: "The iteration loop" })[0]?.getAttribute("href")).toBe("#loop");
  });
});

describe("SelectionToolbar", () => {
  it("shows the toolbar when forced open and reports actions", () => {
    const onAction = vi.fn();
    render(
      <SelectionToolbar actions={[{ id: "bold", label: "Bold", icon: <span /> }, { id: "link", label: "Link", icon: <span />, group: true }]} forceOpen onAction={onAction}>
        <p>Text</p>
      </SelectionToolbar>,
    );
    const toolbar = screen.getByRole("toolbar", { name: "Formatting" });
    fireEvent.click(within(toolbar).getByRole("button", { name: "Link" }));
    expect(onAction).toHaveBeenCalledWith("link", { text: "", range: null });
  });

  it("stays hidden without a selection", () => {
    render(
      <SelectionToolbar actions={[{ id: "bold", label: "Bold", icon: <span /> }]} onAction={vi.fn()}>
        <p>Text</p>
      </SelectionToolbar>,
    );
    expect(screen.queryByRole("toolbar")).toBeNull();
  });
});

describe("BottomTabShell", () => {
  it("links tabs, marks the current one and names badges", () => {
    render(
      <BottomTabShell
        activeId="alerts"
        tabs={[
          { id: "home", label: "Home", href: "/", icon: <span /> },
          { id: "create", label: "Create", href: "/new", icon: <span />, primary: true },
          { id: "alerts", label: "Alerts", href: "/alerts", icon: <span />, badge: 3 },
        ]}
        title="Notifications"
      >
        <p>Page</p>
      </BottomTabShell>,
    );
    expect(screen.getByRole("heading", { name: "Notifications" })).toBeTruthy();
    const alerts = screen.getByRole("link", { name: "Alerts, 3 new" });
    expect(alerts.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Create" }).getAttribute("href")).toBe("/new");
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });
});

describe("HairlineShell", () => {
  it("links nav and projects with counts, collapses on '[' and opens search on '/'", () => {
    const onSearch = vi.fn();
    const onSwitchWorkspace = vi.fn();
    const { workspaces, projects } = hairlineFixtures.getHairlineSidebar;
    render(
      <HairlineShell
        activeId="atlas"
        currentWorkspaceId="northwind"
        nav={[{ id: "inbox", label: "Inbox", href: "/inbox", icon: <span />, count: 4 }]}
        onSearch={onSearch}
        onSwitchWorkspace={onSwitchWorkspace}
        projects={projects}
        title={<span>Atlas</span>}
        user={{ name: "Ines Moreau" }}
        workspaces={workspaces}
      >
        <p>Issues</p>
      </HairlineShell>,
    );
    expect(screen.getByRole("link", { name: "Atlas redesign, 5 open" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Inbox, 4 open" }).getAttribute("href")).toBe("/inbox");
    fireEvent.keyDown(screen.getByText("Issues"), { key: "/" });
    expect(onSearch).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(screen.getByText("Issues"), { key: "[" });
    expect(screen.getAllByRole("button", { name: "Expand sidebar" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "New" })).toBeNull();
  });
});

describe("CanvasEditor", () => {
  it("reports shapes after an edit, deletes the selection with the Delete key and hides unwired controls", async () => {
    const onChange = vi.fn();
    render(<CanvasEditor defaultSelectedId="card" defaultShapes={canvasFixtures.getCanvas} onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getAllByText("1 selected · 320 × 180").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Hide Avatar" })[0] as HTMLElement);
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({ id: "avatar", visible: false })])));
    fireEvent.keyDown(window, { key: "Delete" });
    await waitFor(() => expect(((onChange.mock.lastCall?.[0] ?? []) as { id: string }[]).map((x) => x.id)).toEqual(["hero", "avatar"]));
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
    expect(screen.getByRole("toolbar", { name: "Tools" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Pen|Place image/ })).toBeNull();
  });
});
