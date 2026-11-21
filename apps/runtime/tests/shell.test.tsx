// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The shells' wiring contract: frames around the builder's page.
 */
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { AppShell } from "@/pages/showcase/layouts-app-shell/view";
import { InsetShell } from "@/pages/showcase/layouts-inset-shell/view";
import * as splitFixtures from "@/pages/showcase/layouts-split-shell/fixtures";
import { SplitShell } from "@/pages/showcase/layouts-split-shell/view";

afterEach(cleanup);

function AppLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a data-app-link {...props} />;
}

const base = {
  user: { name: "Ada Lovelace", email: "ada@acme.dev" },
  workspace: { id: "ws", name: "Acme" },
  sections: [{ id: "main", label: "Workspace", items: [
    { id: "home", label: "Home", href: "/home" },
    { id: "inbox", label: "Inbox", href: "/inbox", count: 4 },
  ] }],
};

describe("AppShell", () => {
  it("renders the page inside, marks the active item and links through the builder's router", () => {
    render(
      <WirefrontProvider link={AppLink}>
        <AppShell {...base} activeId="inbox">
          <h1>Inbox page</h1>
        </AppShell>
      </WirefrontProvider>,
    );
    expect(screen.getByRole("heading", { name: "Inbox page" })).toBeTruthy();
    const nav = screen.getAllByRole("navigation", { name: "Workspace" })[0];
    if (!nav) throw new Error("no nav");
    const inbox = within(nav).getByRole("link", { name: /Inbox/ });
    expect(inbox.getAttribute("aria-current")).toBe("page");
    expect(inbox.getAttribute("href")).toBe("/inbox");
    expect(inbox.hasAttribute("data-app-link")).toBe(true);
  });

  it("shows search, the switcher and notifications only when wired", () => {
    const onSearch = vi.fn();
    const { rerender } = render(<AppShell {...base}><p>x</p></AppShell>);
    expect(screen.queryByRole("button", { name: /Search/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Switch workspace/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Notifications/ })).toBeNull();

    rerender(<AppShell {...base} notificationsHref="/n" onSearch={onSearch} unread={3}><p>x</p></AppShell>);
    fireEvent.click(screen.getAllByRole("button", { name: /Search/ })[0] as HTMLElement);
    expect(onSearch).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Notifications, 3 unread" }).getAttribute("href")).toBe("/n");
  });
});

describe("InsetShell", () => {
  const inset = {
    user: { name: "Ines Moreau", email: "ines@northwind.dev" },
    workspace: { id: "nw", name: "Northwind Labs", plan: "Team" },
    sections: [
      { id: "main", items: [{ id: "inbox", label: "Inbox", href: "/inbox", count: 4, attention: true }] },
      { id: "projects", label: "Projects", addHref: "/projects/new", items: [{ id: "atlas", label: "Atlas", href: "/p/atlas", color: "orange" }] },
    ],
  };

  it("frames the page, links through the builder's router and shows breadcrumbs", () => {
    render(
      <WirefrontProvider link={AppLink}>
        <InsetShell {...inset} activeId="atlas" breadcrumbs={[{ label: "Projects", href: "/projects" }, { label: "Atlas" }]}>
          <p>Page body</p>
        </InsetShell>
      </WirefrontProvider>,
    );
    expect(screen.getByText("Page body")).toBeTruthy();
    const primary = within(screen.getByRole("navigation", { name: "Primary" }));
    const atlas = primary.getByRole("link", { name: "Atlas" });
    expect(atlas.getAttribute("aria-current")).toBe("page");
    expect(atlas.hasAttribute("data-app-link")).toBe(true);
    expect(primary.getByRole("link", { name: "New in Projects" }).getAttribute("href")).toBe("/projects/new");
    expect(screen.getByRole("link", { name: "Projects" }).getAttribute("href")).toBe("/projects");
  });

  it("collapses a labelled section and hides everything unwired", () => {
    render(<InsetShell {...inset}>x</InsetShell>);
    expect(screen.queryByRole("button", { name: /Search/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Notifications/ })).toBeNull();
    expect(screen.queryByRole("link", { name: "Help & support" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Ines Moreau/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Projects" }));
    expect(screen.getByRole("button", { name: "Projects" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("switches workspace and signs out through the builder's actions", async () => {
    const onSwitchWorkspace = vi.fn();
    const onSignOut = vi.fn(async () => {});
    const workspaces = [inset.workspace, { id: "fable", name: "Fable & Co" }];
    render(
      <InsetShell {...inset} notificationsHref="/inbox" onSignOut={onSignOut} onSwitchWorkspace={onSwitchWorkspace} unread={4} workspaces={workspaces}>
        x
      </InsetShell>,
    );
    expect(screen.getByRole("link", { name: "Notifications, 4 unread" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Northwind Labs/ }));
    fireEvent.click(await screen.findByRole("menuitemradio", { name: /Fable & Co/ }));
    expect(onSwitchWorkspace).toHaveBeenCalledWith("fable");
    fireEvent.click(screen.getByRole("button", { name: /Ines Moreau/ }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalled();
  });
});

describe("SplitShell", () => {
  // jsdom has no ResizeObserver; the shell then keeps its default (docked, desktop) width.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  const split = { brand: { name: "Orbit" }, items: splitFixtures.listTasks, user: splitFixtures.user };

  it("lists the builder's items as links with their state and marks the open one", () => {
    render(
      <WirefrontProvider link={AppLink} now={() => new Date(splitFixtures.now)}>
        <SplitShell {...split} activeId="t2">
          <p>Thread</p>
        </SplitShell>
      </WirefrontProvider>,
    );
    expect(screen.getByText("Thread")).toBeTruthy();
    const sidebar = within(screen.getByRole("complementary", { name: "Sidebar" }));
    const open = sidebar.getByRole("link", { name: /Draft Q4 pricing memo/ });
    expect(open.getAttribute("aria-current")).toBe("page");
    expect(open.hasAttribute("data-app-link")).toBe(true);
    expect(sidebar.getByRole("img", { name: "Running" })).toBeTruthy();
    expect(sidebar.getByText("1 hour ago")).toBeTruthy();
  });

  it("hides the panel toggle, New and search until they are wired, and lets the panel close itself", () => {
    const { rerender } = render(<SplitShell {...split}>x</SplitShell>);
    expect(screen.queryByRole("button", { name: /work panel/ })).toBeNull();
    expect(screen.queryByRole("link", { name: "New task" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Search/ })).toBeNull();

    rerender(
      <SplitShell {...split} newHref="/new" panel={({ close }) => <button onClick={close} type="button">Close panel</button>}>
        x
      </SplitShell>,
    );
    expect(screen.getAllByRole("link", { name: "New task" })[0]?.getAttribute("href")).toBe("/new");
    const toggle = screen.getByRole("button", { name: "Hide work panel" });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Close panel" }));
    expect(screen.getByRole("button", { name: "Show work panel" }).getAttribute("aria-expanded")).toBe("false");
  });
});
