// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The app shell's wiring contract: a frame around the builder's page.
 */
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { AppShell } from "@/pages/showcase/layouts-app-shell/view";

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
