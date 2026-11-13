// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the onboarding screens.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fail, ok } from "@wirefront/ui/wirefront/types";
import * as firstRunFixtures from "@/pages/showcase/auth-first-run/fixtures";
import { FirstRun, type FirstRunProps } from "@/pages/showcase/auth-first-run/view";
import { InviteTeammates } from "@/pages/showcase/forms-invite-teammates/view";

afterEach(cleanup);

describe("InviteTeammates", () => {
  const typeEmails = (text: string) => {
    const input = screen.getByLabelText("Invitee emails");
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: "Enter" });
  };

  it("sends valid addresses outside the auto-join domain, with their roles and the note", async () => {
    const onSend = vi.fn(async () => ok({ sent: 1 }));
    render(<InviteTeammates autoJoinDomain="acme.com" defaultMessage="Welcome!" onSend={onSend} />);
    typeEmails("alex@globex.com, priya@acme.com, not-an-email");
    expect(screen.getByText("1 to invite")).toBeTruthy();
    expect(screen.getByText("1 auto-join")).toBeTruthy();
    expect(screen.getByText("1 invalid")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "+ Add a personal note" }));
    fireEvent.click(screen.getByRole("button", { name: /Send 1 invite/ }));
    await waitFor(() => expect(onSend).toHaveBeenCalledWith({ invitations: [{ email: "alex@globex.com", role: "member" }], message: "Welcome!" }));
    expect(await screen.findByText("Sent 1 invitations.")).toBeTruthy();
    expect(screen.queryByText("alex@globex.com")).toBeNull();
  });

  it("ignores duplicates, uses the default role, and shows a failure", async () => {
    const onSend = vi.fn(async () => {
      throw new Error("Invitations are paused for this workspace.");
    });
    render(<InviteTeammates onSend={onSend} />);
    typeEmails("ada@x.dev ada@x.dev");
    expect(screen.getAllByText("ada@x.dev")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Send 1 invite/ }));
    expect((await screen.findByRole("alert")).textContent).toBe("Invitations are paused for this workspace.");
    expect(screen.queryByText(/auto-join/i)).toBeNull();
    expect(screen.queryByText("Copy link")).toBeNull();
  });
});

describe("FirstRun", () => {
  const props = (overrides: Partial<FirstRunProps> = {}): FirstRunProps => ({
    product: "Hearth",
    domain: "hearth.app",
    defaultWorkspaceName: "Northwind Labs",
    useCases: firstRunFixtures.useCases,
    tools: firstRunFixtures.tools,
    templates: firstRunFixtures.templates,
    checkSlug: vi.fn(async (slug: string) => slug !== "northwind"),
    onSaveWorkspace: vi.fn(async () => {}),
    onConnectTool: vi.fn(async () => {}),
    onInvite: vi.fn(async () => {}),
    onCreateAgent: vi.fn(async () => {}),
    ...overrides,
  });
  const button = (name: string | RegExp) => screen.getByRole("button", { name });
  const continueEnabled = () => waitFor(() => expect(button("Continue").hasAttribute("disabled")).toBe(false));

  it("checks the URL with the backend and saves the workspace before moving on", async () => {
    const p = props();
    render(<FirstRun {...p} defaultUseCases={["Support"]} />);
    await continueEnabled();
    expect(p.checkSlug).toHaveBeenCalledWith("northwind-labs");

    fireEvent.change(screen.getByLabelText("Workspace URL"), { target: { value: "northwind" } });
    await waitFor(() => expect(screen.getByText("hearth.app/northwind is taken. Try another.")).toBeTruthy());
    expect(button("Continue").hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("Workspace URL"), { target: { value: "Northwind HQ" } });
    await continueEnabled();
    fireEvent.click(screen.getByRole("radio", { name: "Violet" }));
    fireEvent.click(button("Engineering"));
    fireEvent.click(button("Continue"));
    await waitFor(() =>
      expect(p.onSaveWorkspace).toHaveBeenCalledWith({ name: "Northwind Labs", slug: "northwind-hq", color: "violet", useCases: ["Support", "Engineering"] }),
    );
    expect(await screen.findByText("Connect your tools")).toBeTruthy();
  });

  it("stays on the step and shows why when saving fails", async () => {
    const p = props({ onSaveWorkspace: vi.fn(async () => fail(undefined, { slug: "That URL was just taken." })) });
    render(<FirstRun {...p} />);
    await continueEnabled();
    fireEvent.click(button("Continue"));
    expect((await screen.findByRole("alert")).textContent).toBe("That URL was just taken.");
    expect(screen.getByText("Name your workspace", { selector: "h2" })).toBeTruthy();
  });

  it("connects tools through the builder, and only offers disconnect when it's wired", async () => {
    const p = props({ connectedToolIds: ["forge"] });
    render(<FirstRun {...p} />);
    await continueEnabled();
    fireEvent.click(button("Continue"));
    fireEvent.click(await screen.findByRole("button", { name: "Connect Relay" }));
    await waitFor(() => expect(p.onConnectTool).toHaveBeenCalledWith("relay"));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Connect Relay" })).toBeNull());
    expect(screen.queryByRole("button", { name: /disconnect/i })).toBeNull();
    expect(screen.getAllByText("Connected")).toHaveLength(2);
  });

  it("sends invites with the chosen role and keeps the addresses when sending fails", async () => {
    const onInvite = vi.fn(async () => {
      throw new Error("Invitations are paused.");
    });
    render(<FirstRun {...props({ onInvite })} />);
    await continueEnabled();
    fireEvent.click(button("Continue"));
    fireEvent.click(await screen.findByRole("button", { name: "Skip for now" }));
    const input = await screen.findByLabelText("Email addresses");
    fireEvent.change(input, { target: { value: "ada@x.dev" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.click(button("Invite"));
    await waitFor(() => expect(onInvite).toHaveBeenCalledWith({ invitations: [{ email: "ada@x.dev", role: "member" }] }));
    expect((await screen.findByRole("alert")).textContent).toBe("Invitations are paused.");
    expect(screen.getByRole("button", { name: "Remove ada@x.dev" })).toBeTruthy();
    expect(screen.getByText("No invites yet. You can always do this later.")).toBeTruthy();
  });

  it("creates the agent last, then links to the workspace; unwired extras stay hidden", async () => {
    const p = props();
    const { rerender } = render(<FirstRun {...p} />);
    expect(screen.queryByRole("button", { name: "Book a walkthrough" })).toBeNull();
    await continueEnabled();
    fireEvent.click(button("Continue"));
    fireEvent.click(await screen.findByRole("button", { name: "Skip for now" }));
    await screen.findByText("Invite your team");
    fireEvent.click(button("Skip for now"));
    fireEvent.click(await screen.findByRole("radio", { name: /Research analyst/ }));
    fireEvent.click(button("Create agent"));
    await waitFor(() =>
      expect(p.onCreateAgent).toHaveBeenCalledWith({
        templateId: "research",
        name: "Research analyst",
        instructions: firstRunFixtures.templates[1]?.instructions,
      }),
    );
    expect(await screen.findByText("Northwind Labs is ready")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Open workspace/ })).toBeNull();
    rerender(<FirstRun {...p} workspaceHref="/w/northwind-labs" />);
    expect(screen.getByRole("link", { name: /Open workspace/ }).getAttribute("href")).toBe("/w/northwind-labs");
  });
});
